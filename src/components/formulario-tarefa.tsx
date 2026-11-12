"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import {
  type ErrosDeCampo,
  errosDeCampoDoBackend,
  mensagemDeErro,
} from "@/lib/erros";
import {
  DESCRICAO_MAX,
  TITULO_MAX,
  type Tarefa,
  dadosTarefaSchema,
} from "@/lib/tarefa";
import { trpc } from "@/trpc/client";

import { useAvisos } from "./avisos";

export function FormularioTarefa({ tarefa }: { tarefa?: Tarefa }) {
  const router = useRouter();
  const avisos = useAvisos();
  const utils = trpc.useUtils();

  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [erros, setErros] = useState<ErrosDeCampo>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const opcoes = {
    onSuccess: async () => {
      await utils.tarefa.listar.invalidate();
      avisos.sucesso(tarefa ? "Tarefa atualizada." : "Tarefa criada.");
      router.push("/");
    },
    onError: (erro: Parameters<typeof mensagemDeErro>[0]) => {
      setErros(errosDeCampoDoBackend(erro));
      setErroGeral(mensagemDeErro(erro));
    },
  };
  const criar = trpc.tarefa.criar.useMutation(opcoes);
  const atualizar = trpc.tarefa.atualizar.useMutation(opcoes);

  // Continua "enviando" após o sucesso, até a navegação terminar, para
  // impedir um segundo envio nesse intervalo.
  const enviando =
    criar.isPending ||
    atualizar.isPending ||
    criar.isSuccess ||
    atualizar.isSuccess;

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    // Mesmo schema do backend: o formulário valida antes de enviar e o
    // servidor valida de novo.
    const resultado = dadosTarefaSchema.safeParse({ titulo, descricao });
    if (!resultado.success) {
      const porCampo = z.flattenError(resultado.error).fieldErrors;
      setErros({
        titulo: porCampo.titulo?.[0],
        descricao: porCampo.descricao?.[0],
      });
      return;
    }

    setErros({});
    if (tarefa) {
      atualizar.mutate({ id: tarefa.id, ...resultado.data });
    } else {
      criar.mutate(resultado.data);
    }
  }

  return (
    <form className="formulario" onSubmit={aoEnviar} noValidate>
      {erroGeral && (
        <p className="alerta" role="alert">
          {erroGeral}
        </p>
      )}

      <div className="campo">
        <label htmlFor="titulo">
          Título <span aria-hidden="true">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          value={titulo}
          maxLength={TITULO_MAX}
          autoFocus
          required
          aria-invalid={Boolean(erros.titulo)}
          aria-describedby={erros.titulo ? "titulo-erro" : undefined}
          onChange={(evento) => {
            setTitulo(evento.target.value);
            setErros((atuais) => ({ ...atuais, titulo: undefined }));
          }}
        />
        {erros.titulo && (
          <p id="titulo-erro" className="texto-erro">
            {erros.titulo}
          </p>
        )}
      </div>

      <div className="campo">
        <label htmlFor="descricao">Descrição (opcional)</label>
        <textarea
          id="descricao"
          name="descricao"
          rows={5}
          value={descricao}
          maxLength={DESCRICAO_MAX}
          aria-invalid={Boolean(erros.descricao)}
          aria-describedby={erros.descricao ? "descricao-erro" : undefined}
          onChange={(evento) => {
            setDescricao(evento.target.value);
            setErros((atuais) => ({ ...atuais, descricao: undefined }));
          }}
        />
        {erros.descricao && (
          <p id="descricao-erro" className="texto-erro">
            {erros.descricao}
          </p>
        )}
      </div>

      <div className="formulario__acoes">
        <Link href="/" className="botao">
          Cancelar
        </Link>
        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? "Salvando…" : tarefa ? "Salvar alterações" : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
}
