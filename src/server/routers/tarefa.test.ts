import { describe, expect, it, vi } from "vitest";

// O pacote `server-only` lança erro fora do Next; nos testes ele é neutralizado.
vi.mock("server-only", () => ({}));

import { appRouter } from "@/server/routers/_app";
import { createCallerFactory } from "@/server/trpc";

// Chama as procedures diretamente, sem HTTP — do mesmo jeito que o SSR faz.
const api = createCallerFactory(appRouter)({});

async function listarTudo(busca?: string) {
  const itens = [];
  let cursor: number | null = null;
  do {
    const pagina = await api.tarefa.listar({ limite: 10, cursor, busca });
    itens.push(...pagina.itens);
    cursor = pagina.proximoCursor;
  } while (cursor !== null);
  return itens;
}

describe("tarefa.criar", () => {
  it("cria com id, data de criação e título sem espaços nas pontas", async () => {
    const tarefa = await api.tarefa.criar({ titulo: "  Estudar tRPC  " });

    expect(tarefa.titulo).toBe("Estudar tRPC");
    expect(tarefa.id).toBeGreaterThan(0);
    expect(tarefa.dataCriacao).toBeInstanceOf(Date);
    expect(tarefa.descricao).toBeUndefined();
  });

  it("gera ids únicos", async () => {
    const a = await api.tarefa.criar({ titulo: "A" });
    const b = await api.tarefa.criar({ titulo: "B" });

    expect(a.id).not.toBe(b.id);
  });

  it.each(["", "   "])("recusa título vazio (%j)", async (titulo) => {
    await expect(api.tarefa.criar({ titulo })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("recusa título acima do limite", async () => {
    await expect(
      api.tarefa.criar({ titulo: "a".repeat(121) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("tarefa.atualizar", () => {
  it("altera título e descrição, preservando id e data de criação", async () => {
    const original = await api.tarefa.criar({ titulo: "Antes", descricao: "x" });
    const atualizada = await api.tarefa.atualizar({
      id: original.id,
      titulo: "Depois",
    });

    expect(atualizada).toEqual({
      id: original.id,
      titulo: "Depois",
      descricao: undefined,
      dataCriacao: original.dataCriacao,
    });
    expect(await api.tarefa.buscarPorId({ id: original.id })).toEqual(atualizada);
  });

  it("retorna NOT_FOUND para tarefa inexistente", async () => {
    await expect(
      api.tarefa.atualizar({ id: 999_999, titulo: "x" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("recusa título vazio", async () => {
    const tarefa = await api.tarefa.criar({ titulo: "Válida" });

    await expect(
      api.tarefa.atualizar({ id: tarefa.id, titulo: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("tarefa.deletar", () => {
  it("remove a tarefa; repetir retorna NOT_FOUND", async () => {
    const tarefa = await api.tarefa.criar({ titulo: "Temporária" });

    await expect(api.tarefa.deletar({ id: tarefa.id })).resolves.toEqual({
      id: tarefa.id,
    });
    await expect(
      api.tarefa.buscarPorId({ id: tarefa.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      api.tarefa.deletar({ id: tarefa.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("tarefa.listar", () => {
  it("pagina por cursor sem repetir nem pular itens, da mais nova à mais antiga", async () => {
    const primeira = await api.tarefa.listar({ limite: 10 });
    const todas = await listarTudo();
    const ids = todas.map((tarefa) => tarefa.id);

    expect(primeira.itens).toHaveLength(10);
    expect(primeira.proximoCursor).toBe(primeira.itens.at(-1)?.id);
    expect(todas).toHaveLength(primeira.total);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });

  it("não repete nem pula itens quando uma tarefa é excluída no meio da paginação", async () => {
    const primeira = await api.tarefa.listar({ limite: 10 });
    const esperadas = (await listarTudo())
      .map((tarefa) => tarefa.id)
      .filter((id) => id < primeira.proximoCursor!);

    await api.tarefa.deletar({ id: primeira.itens[0]!.id });

    const restante = [];
    let cursor = primeira.proximoCursor;
    while (cursor !== null) {
      const pagina = await api.tarefa.listar({ limite: 10, cursor });
      restante.push(...pagina.itens.map((tarefa) => tarefa.id));
      cursor = pagina.proximoCursor;
    }
    expect(restante).toEqual(esperadas);
  });

  it("busca por título ou descrição, ignorando maiúsculas e acentos", async () => {
    const porTitulo = await api.tarefa.criar({ titulo: "Revisão ÚNICA-xyz" });
    const porDescricao = await api.tarefa.criar({
      titulo: "Outra",
      descricao: "contém revisao unica-xyz no texto",
    });

    const achadas = await listarTudo("revisao unica-XYZ");

    expect(achadas.map((tarefa) => tarefa.id)).toEqual([
      porDescricao.id,
      porTitulo.id,
    ]);
  });

  it("retorna lista vazia quando nada corresponde à busca", async () => {
    await expect(
      api.tarefa.listar({ limite: 10, busca: "termo-que-nao-existe" }),
    ).resolves.toEqual({ itens: [], total: 0, proximoCursor: null });
  });
});
