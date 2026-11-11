import { z } from "zod";

/**
 * Modelo e regras de validação de tarefas.
 *
 * Este arquivo é a única fonte de verdade das regras: o backend (tRPC) usa os
 * schemas para validar a entrada e o formulário usa os mesmos schemas para
 * validar antes do envio — assim as duas pontas nunca divergem.
 */

export const TITULO_MAX = 120;
export const DESCRICAO_MAX = 1000;
export const TAREFAS_POR_PAGINA = 10;

export interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
}

const idSchema = z.number().int().positive();

export const dadosTarefaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "O título é obrigatório.")
    .max(TITULO_MAX, `O título deve ter no máximo ${TITULO_MAX} caracteres.`),
  descricao: z
    .string()
    .trim()
    .max(
      DESCRICAO_MAX,
      `A descrição deve ter no máximo ${DESCRICAO_MAX} caracteres.`,
    )
    // Descrição vazia é tratada como "sem descrição".
    .transform((valor) => valor || undefined)
    .optional(),
});

export const atualizarTarefaSchema = dadosTarefaSchema.extend({ id: idSchema });

export const idTarefaSchema = z.object({ id: idSchema });

export const listarTarefasSchema = z.object({
  limite: z.number().int().min(1).max(50).default(TAREFAS_POR_PAGINA),
  cursor: idSchema.nullish(),
  // Filtra por título ou descrição.
  busca: z.string().trim().max(100).optional(),
});

export type DadosTarefa = z.output<typeof dadosTarefaSchema>;
export type CampoTarefa = keyof DadosTarefa;
