import type { Metadata } from "next";

import { FormularioTarefa } from "@/components/formulario-tarefa";
import { Voltar } from "@/components/voltar";

export const metadata: Metadata = { title: "Nova tarefa" };

export default function PaginaNovaTarefa() {
  return (
    <div className="pagina-formulario">
      <Voltar />
      <h1>Nova tarefa</h1>
      <FormularioTarefa />
    </div>
  );
}
