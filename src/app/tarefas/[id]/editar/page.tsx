import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormularioTarefa } from "@/components/formulario-tarefa";
import { Voltar } from "@/components/voltar";
import { trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Editar tarefa" };

async function buscarTarefa(id: number) {
  try {
    return await trpc.tarefa.buscarPorId({ id });
  } catch (erro) {
    // Id inválido ou tarefa inexistente viram a página 404.
    if (
      erro instanceof TRPCError &&
      (erro.code === "NOT_FOUND" || erro.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw erro;
  }
}

export default async function PaginaEditarTarefa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // A tarefa é carregada no servidor: o formulário já chega preenchido.
  const tarefa = await buscarTarefa(Number(id));

  return (
    <div className="pagina-formulario">
      <Voltar />
      <h1>Editar tarefa</h1>
      <FormularioTarefa tarefa={tarefa} />
    </div>
  );
}
