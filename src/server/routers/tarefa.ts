import { TRPCError } from "@trpc/server";

import {
  atualizarTarefaSchema,
  dadosTarefaSchema,
  idTarefaSchema,
  listarTarefasSchema,
} from "@/lib/tarefa";
import { tarefaStore } from "@/server/tarefa-store";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

function tarefaNaoEncontrada(id: number) {
  return new TRPCError({
    code: "NOT_FOUND",
    message: `Tarefa ${id} não encontrada. Ela pode ter sido excluída.`,
  });
}

export const tarefaRouter = createTRPCRouter({
  listar: publicProcedure
    .input(listarTarefasSchema)
    .query(({ input }) => tarefaStore.listar(input)),

  buscarPorId: publicProcedure.input(idTarefaSchema).query(({ input }) => {
    const tarefa = tarefaStore.buscarPorId(input.id);
    if (!tarefa) throw tarefaNaoEncontrada(input.id);
    return tarefa;
  }),

  criar: publicProcedure
    .input(dadosTarefaSchema)
    .mutation(({ input }) => tarefaStore.criar(input)),

  atualizar: publicProcedure
    .input(atualizarTarefaSchema)
    .mutation(({ input: { id, ...dados } }) => {
      const tarefa = tarefaStore.atualizar(id, dados);
      if (!tarefa) throw tarefaNaoEncontrada(id);
      return tarefa;
    }),

  deletar: publicProcedure.input(idTarefaSchema).mutation(({ input }) => {
    if (!tarefaStore.deletar(input.id)) throw tarefaNaoEncontrada(input.id);
    return { id: input.id };
  }),
});
