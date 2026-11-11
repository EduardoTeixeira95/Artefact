"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { mensagemDeErro } from "@/lib/erros";
import { TAREFAS_POR_PAGINA } from "@/lib/tarefa";
import { trpc } from "@/trpc/client";

import { ItemTarefa } from "./item-tarefa";

const ATRASO_BUSCA_MS = 300;

export function ListaTarefas() {
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState("");

  // Só busca quando o usuário para de digitar, para não disparar uma
  // requisição a cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setBusca(texto.trim()), ATRASO_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [texto]);

  const {
    data,
    error,
    isPending,
    isPlaceholderData,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = trpc.tarefa.listar.useInfiniteQuery(
    // Sem busca, a consulta é a mesma que o servidor pré-carregou no SSR.
    { limite: TAREFAS_POR_PAGINA, busca: busca || undefined },
    {
      getNextPageParam: (ultimaPagina) => ultimaPagina.proximoCursor,
      // Mantém a lista anterior na tela enquanto a nova busca carrega.
      placeholderData: keepPreviousData,
    },
  );

  // Scroll infinito: quando o botão "Carregar mais" entra na tela, a próxima
  // página é buscada; o clique continua como alternativa.
  const sentinelaRef = useRef<HTMLButtonElement>(null);
  const podeCarregarSozinho =
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError;

  useEffect(() => {
    const sentinela = sentinelaRef.current;
    if (!sentinela || !podeCarregarSozinho) return;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinela);
    return () => observer.disconnect();
  }, [podeCarregarSozinho, fetchNextPage, data?.pages.length]);

  const tarefas = data?.pages.flatMap((pagina) => pagina.itens) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const totalTexto = `${total} ${total === 1 ? "tarefa" : "tarefas"}`;

  function limparBusca() {
    setTexto("");
    setBusca("");
  }

  function renderLista() {
    if (isPending) {
      return (
        <p className="estado" role="status">
          Carregando tarefas…
        </p>
      );
    }

    if (!data) {
      return (
        <div className="estado estado--erro" role="alert">
          <p>Não foi possível carregar as tarefas. {mensagemDeErro(error)}</p>
          <button type="button" className="botao" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      );
    }

    if (tarefas.length === 0) {
      return busca ? (
        <div className="estado">
          <p>Nenhuma tarefa encontrada para “{busca}”.</p>
          <button type="button" className="botao" onClick={limparBusca}>
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="estado">
          <p>Nenhuma tarefa por aqui ainda.</p>
          <Link href="/tarefas/nova" className="botao botao--primario">
            <Plus size={16} aria-hidden />
            Criar a primeira tarefa
          </Link>
        </div>
      );
    }

    return (
      <>
        <ul className="lista" aria-busy={isPlaceholderData}>
          {tarefas.map((tarefa) => (
            <ItemTarefa key={tarefa.id} tarefa={tarefa} />
          ))}
        </ul>

        <div className="lista__rodape">
          {isFetchNextPageError && (
            <p className="texto-erro" role="alert">
              Não foi possível carregar mais tarefas.
            </p>
          )}

          {hasNextPage ? (
            <button
              ref={sentinelaRef}
              type="button"
              className="botao"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage
                ? "Carregando mais…"
                : isFetchNextPageError
                  ? "Tentar novamente"
                  : "Carregar mais"}
            </button>
          ) : (
            <p className="texto-suave">Fim da lista.</p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="barra">
        <label className="busca">
          <Search size={18} aria-hidden />
          <input
            type="search"
            placeholder="Buscar tarefas..."
            aria-label="Buscar tarefas"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
        </label>
        <Link href="/tarefas/nova" className="botao botao--primario">
          <Plus size={18} aria-hidden />
          Nova Tarefa
        </Link>
      </div>

      <header className="cabecalho">
        <div>
          <h1>
            Gerenciador de Tarefas
            {data && !busca && <span className="selo">{totalTexto}</span>}
          </h1>
          <p className="cabecalho__subtitulo">
            Crie, edite e acompanhe as suas tarefas em um só lugar.
          </p>
        </div>
        {data && busca && (
          <p className="filtro">
            Filtrando {totalTexto}
            <button type="button" className="link" onClick={limparBusca}>
              Limpar busca
            </button>
          </p>
        )}
      </header>

      {renderLista()}
    </>
  );
}
