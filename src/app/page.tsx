import { ListaTarefas } from "@/components/lista-tarefas";
import { TAREFAS_POR_PAGINA } from "@/lib/tarefa";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function PaginaListagem() {
  // SSR: a primeira página de tarefas é buscada no servidor e já vai no HTML.
  // O `HydrateClient` entrega os mesmos dados ao cache do navegador.
  await trpc.tarefa.listar.prefetchInfinite({ limite: TAREFAS_POR_PAGINA });

  return (
    <HydrateClient>
      <ListaTarefas />
    </HydrateClient>
  );
}
