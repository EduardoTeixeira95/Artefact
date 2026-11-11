import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/server/routers/_app";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
    onError({ error, path }) {
      // Erros esperados (validação, não encontrado) não precisam de log.
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`Erro no tRPC em "${path ?? "?"}":`, error);
      }
    },
  });

export { handler as GET, handler as POST };
