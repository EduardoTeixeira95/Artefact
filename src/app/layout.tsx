import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AvisosProvider } from "@/components/avisos";
import { TRPCReactProvider } from "@/trpc/client";

import "./globals.css";

const fonte = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gerenciador de Tarefas",
  description: "Gerenciamento simples de tarefas com Next.js e tRPC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={fonte.className}>
        <TRPCReactProvider>
          <AvisosProvider>
            <main className="container">{children}</main>
          </AvisosProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
