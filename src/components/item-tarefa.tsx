"use client";

import { Clock, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";

import { mensagemDeErro } from "@/lib/erros";
import type { Tarefa } from "@/lib/tarefa";
import { trpc } from "@/trpc/client";

import { useAvisos } from "./avisos";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function ItemTarefa({ tarefa }: { tarefa: Tarefa }) {
  const avisos = useAvisos();
  const utils = trpc.useUtils();

  const deletar = trpc.tarefa.deletar.useMutation({
    onSuccess: () => avisos.sucesso(`Tarefa "${tarefa.titulo}" excluída.`),
    onError: (erro) => avisos.erro(mensagemDeErro(erro)),
    // Recarrega a lista também no erro: uma tarefa já excluída em outra aba
    // some daqui em vez de ficar presa na tela.
    onSettled: () => utils.tarefa.listar.invalidate(),
  });

  function aoExcluir() {
    if (window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) {
      deletar.mutate({ id: tarefa.id });
    }
  }

  return (
    <li className="tarefa" aria-busy={deletar.isPending}>
      <div className="tarefa__conteudo">
        <h2 className="tarefa__titulo">{tarefa.titulo}</h2>
        {tarefa.descricao && (
          <p className="tarefa__descricao">{tarefa.descricao}</p>
        )}
        <time
          className="tarefa__data"
          dateTime={tarefa.dataCriacao.toISOString()}
          suppressHydrationWarning
        >
          <Clock size={14} aria-hidden />
          Criada em {formatoData.format(tarefa.dataCriacao)}
        </time>
      </div>

      <div className="tarefa__acoes">
        <Link href={`/tarefas/${tarefa.id}/editar`} className="botao">
          <SquarePen size={15} aria-hidden />
          Editar
        </Link>
        <button
          type="button"
          className="botao botao--perigo"
          disabled={deletar.isPending}
          onClick={aoExcluir}
        >
          <Trash2 size={15} aria-hidden />
          {deletar.isPending ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </li>
  );
}
