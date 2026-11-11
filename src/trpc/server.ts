import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";

import { appRouter, type AppRouter } from "@/server/routers/_app";
import { createCallerFactory } from "@/server/trpc";

import { makeQueryClient } from "./query-client";

// `cache` garante um QueryClient por requisição.
export const getQueryClient = cache(makeQueryClient);

const caller = createCallerFactory(appRouter)({});

export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
