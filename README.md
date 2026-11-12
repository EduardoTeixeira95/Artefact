# Gerenciador de Tarefas

Aplicação de gerenciamento de tarefas feita com **Next.js 15** (App Router), **React 19**, **TypeScript** e **tRPC 11**. As tarefas ficam em memória no servidor — não há banco de dados.

## Como executar

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

Outros comandos:

| Comando             | O que faz                              |
| ------------------- | -------------------------------------- |
| `npm run build`     | Gera o build de produção               |
| `npm start`         | Sobe o build de produção               |
| `npm run lint`      | Roda o ESLint                          |
| `npm run typecheck` | Checa os tipos com o TypeScript        |
| `npm test`          | Roda os testes do backend (Vitest)     |

> O servidor já inicia com 25 tarefas de exemplo, para que a listagem e o scroll infinito possam ser vistos de imediato. Como os dados ficam em memória, tudo volta ao estado inicial quando o servidor reinicia.

## Funcionalidades

- **Listagem** (`/`) renderizada no servidor (SSR), com scroll infinito e exclusão direto na lista.
- **Busca** por título ou descrição, ignorando maiúsculas e acentos, feita no backend para funcionar junto com a paginação.
- **Criação** (`/tarefas/nova`) e **edição** (`/tarefas/[id]/editar`) com o mesmo formulário.
- **Validação** no formulário e no backend, com as mesmas regras.
- **Feedback** de carregamento, sucesso e erro em todas as operações.

## Como funciona

### Backend (tRPC)

O router `tarefa` expõe cinco procedures em `/api/trpc`:

| Procedure            | Tipo     | Descrição                                           |
| -------------------- | -------- | --------------------------------------------------- |
| `tarefa.listar`      | query    | Lista paginada por cursor, da mais recente à mais antiga, com busca opcional |
| `tarefa.buscarPorId` | query    | Retorna uma tarefa (usada na página de edição)      |
| `tarefa.criar`       | mutation | Cria uma tarefa                                     |
| `tarefa.atualizar`   | mutation | Edita título e descrição                            |
| `tarefa.deletar`     | mutation | Remove uma tarefa                                   |

Cada tarefa tem `id`, `titulo` (obrigatório), `descricao` (opcional) e `dataCriacao`.

Erros:

- Entrada inválida (por exemplo, título vazio) → `BAD_REQUEST`, com as mensagens separadas por campo.
- Atualizar, excluir ou buscar uma tarefa que não existe → `NOT_FOUND`, com mensagem explicativa.

### Frontend

- A página de listagem é um Server Component: ela busca a primeira página de tarefas chamando o tRPC direto no servidor e envia o HTML já preenchido. Os mesmos dados são entregues ao cache do React Query no navegador, que continua a paginação de onde o servidor parou, sem refazer a primeira busca.
- As próximas páginas são carregadas quando o fim da lista se aproxima da tela (`IntersectionObserver`). O botão "Carregar mais" continua disponível como alternativa.
- A página de edição também carrega a tarefa no servidor; se ela não existir, a resposta é um 404.

## Estrutura

```
src/
├── app/                        # Rotas (App Router)
│   ├── page.tsx                # Listagem (SSR)
│   ├── tarefas/nova/           # Criação
│   ├── tarefas/[id]/editar/    # Edição
│   └── api/trpc/[trpc]/        # Endpoint HTTP do tRPC
├── components/                 # Lista, item, formulário e avisos
├── lib/
│   ├── tarefa.ts               # Modelo e schemas Zod (compartilhados)
│   └── erros.ts                # Tradução de erros do tRPC para o usuário
├── server/
│   ├── tarefa-store.ts         # Repositório em memória
│   ├── trpc.ts                 # Inicialização do tRPC
│   └── routers/                # Procedures
└── trpc/                       # Integração tRPC + React Query (cliente e servidor)
```

## Principais decisões

- **Um schema, duas validações.** As regras ficam em `src/lib/tarefa.ts` (Zod). O formulário valida antes de enviar, para resposta imediata; o backend valida de novo, porque é ele quem garante. Se o backend recusar, os erros aparecem nos mesmos campos.
- **Id sequencial e paginação por cursor.** O id é um inteiro crescente, como um `serial` de banco. Ele define a ordem da lista e serve de cursor, então criar ou excluir tarefas durante a rolagem não repete nem pula itens — o que aconteceria com paginação por página/offset.
- **Estado em `globalThis`.** O Next carrega os módulos do servidor mais de uma vez (páginas, rota de API, hot reload). Guardar a lista em `globalThis` garante uma única lista para todos.
- **Repositório isolado.** Todo o acesso aos dados passa por `tarefa-store.ts`. Trocar a memória por um banco de dados mudaria só esse arquivo.
- **Exclusão sem atualização otimista.** O item fica marcado como "Excluindo…" e a lista é recarregada após a resposta. É mais simples e a tela nunca mostra algo que o servidor não confirmou.
- **Avisos em contexto no layout.** As mensagens de sucesso e erro sobrevivem à navegação: "Tarefa criada" aparece no formulário e continua visível na listagem.
- **CSS puro.** Um único arquivo de estilos, sem biblioteca de UI. Os ícones vêm do `lucide-react` e a fonte, do `next/font`.
- **Busca no servidor.** Como a lista é paginada, filtrar no navegador só alcançaria as tarefas já carregadas. O termo vai para `tarefa.listar`, que filtra antes de paginar; o campo espera o usuário parar de digitar para consultar.
- **`superjson`.** Permite trafegar `Date` entre servidor e cliente sem conversão manual.

## Limitações conhecidas

- Os dados não persistem entre reinicializações e não são compartilhados entre instâncias do servidor (limitação esperada de um armazenamento em memória).
- Os testes automatizados cobrem o backend (CRUD, validação, erros, paginação e busca), em `src/server/routers/tarefa.test.ts`. A interface não tem testes automatizados.
- A exclusão pede confirmação com o diálogo nativo do navegador (`window.confirm`), sem modal próprio.
