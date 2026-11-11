import "server-only";

import type { DadosTarefa, Tarefa } from "@/lib/tarefa";

interface Estado {
  tarefas: Map<number, Tarefa>;
  proximoId: number;
}

interface FiltroTarefas {
  limite: number;
  cursor?: number | null;
  busca?: string;
}

// Minúsculas e sem acentos, para a busca achar "Descrição" com "descricao".
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const TAREFAS_DE_EXEMPLO = 25;

function criarEstadoInicial(): Estado {
  const estado: Estado = { tarefas: new Map(), proximoId: 1 };

  // Tarefas de exemplo, para a listagem e o scroll infinito poderem ser
  // vistos sem cadastrar dezenas de itens à mão.
  const agora = Date.now();
  for (let i = 1; i <= TAREFAS_DE_EXEMPLO; i++) {
    const id = estado.proximoId++;
    estado.tarefas.set(id, {
      id,
      titulo: `Tarefa de exemplo ${i}`,
      descricao: i % 3 === 0 ? undefined : `Descrição da tarefa de exemplo ${i}.`,
      dataCriacao: new Date(agora - (TAREFAS_DE_EXEMPLO - i) * 60_000),
    });
  }

  return estado;
}

// O Next carrega este módulo mais de uma vez (páginas, rota de API, hot
// reload). Guardar o estado em `globalThis` garante uma única lista.
const global = globalThis as typeof globalThis & { __tarefas?: Estado };
const estado = (global.__tarefas ??= criarEstadoInicial());

export const tarefaStore = {
  // Paginação por cursor: o id é sequencial, então `cursor` é o id da última
  // tarefa já entregue. Criar ou excluir tarefas não repete nem pula itens.
  listar({ limite, cursor, busca }: FiltroTarefas) {
    const termo = busca && normalizar(busca);
    const encontradas = [...estado.tarefas.values()]
      .filter(
        (tarefa) =>
          !termo ||
          normalizar(`${tarefa.titulo} ${tarefa.descricao ?? ""}`).includes(termo),
      )
      .sort((a, b) => b.id - a.id);

    const restantes = encontradas.filter(
      (tarefa) => cursor == null || tarefa.id < cursor,
    );
    const itens = restantes.slice(0, limite);
    const haMais = restantes.length > limite;

    return {
      itens,
      total: encontradas.length,
      proximoCursor: haMais ? itens.at(-1)!.id : null,
    };
  },

  buscarPorId(id: number): Tarefa | undefined {
    return estado.tarefas.get(id);
  },

  criar(dados: DadosTarefa): Tarefa {
    const tarefa: Tarefa = {
      id: estado.proximoId++,
      ...dados,
      dataCriacao: new Date(),
    };
    estado.tarefas.set(tarefa.id, tarefa);
    return tarefa;
  },

  /** Retorna `undefined` se a tarefa não existir. */
  atualizar(id: number, dados: DadosTarefa): Tarefa | undefined {
    const atual = estado.tarefas.get(id);
    if (!atual) return undefined;

    const atualizada: Tarefa = { ...atual, ...dados, descricao: dados.descricao };
    estado.tarefas.set(id, atualizada);
    return atualizada;
  },

  /** Retorna `false` se a tarefa não existir. */
  deletar(id: number): boolean {
    return estado.tarefas.delete(id);
  },
};
