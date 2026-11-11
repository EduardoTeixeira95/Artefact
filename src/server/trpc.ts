import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";

const t = initTRPC.create({
  transformer: superjson,
  // Anexa os erros de validação do Zod separados por campo, para o
  // formulário exibir cada mensagem ao lado do campo certo.
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        errosDeValidacao:
          error.cause instanceof ZodError
            ? z.flattenError(error.cause).fieldErrors
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
