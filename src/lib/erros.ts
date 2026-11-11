import type { TRPCClientErrorLike } from "@trpc/client";

import type { CampoTarefa } from "@/lib/tarefa";
import type { AppRouter } from "@/server/routers/_app";

type ErroTRPC = TRPCClientErrorLike<AppRouter>;

export type ErrosDeCampo = Partial<Record<CampoTarefa, string>>;

/** Erros de validação devolvidos pelo backend, um por campo do formulário. */
export function errosDeCampoDoBackend(erro: ErroTRPC): ErrosDeCampo {
  const porCampo: Record<string, string[] | undefined> =
    erro.data?.errosDeValidacao ?? {};

  return {
    titulo: porCampo.titulo?.[0],
    descricao: porCampo.descricao?.[0],
  };
}

export function mensagemDeErro(erro: ErroTRPC): string {
  if (!erro.data) {
    return "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.";
  }

  switch (erro.data.code) {
    case "NOT_FOUND":
      return erro.message;
    case "BAD_REQUEST":
      return "Alguns dados são inválidos. Revise os campos e tente novamente.";
    default:
      return "Ocorreu um erro inesperado. Tente novamente.";
  }
}
