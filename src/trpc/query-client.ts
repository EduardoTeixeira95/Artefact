import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

/** Configuração única do React Query, usada no servidor e no navegador. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Evita refazer no navegador a busca que o servidor acabou de fazer.
        staleTime: 30 * 1000,
      },
      // Preserva `Date` nos dados enviados do servidor para o navegador.
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });
}
