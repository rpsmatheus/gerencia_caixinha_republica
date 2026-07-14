# Andamento do Projeto — Caixinha App

> Última atualização: Julho de 2026

---

## Visão Geral

O Caixinha App é um sistema web para gestão financeira de repúblicas estudantis, desenvolvido com arquitetura REST API + SPA, **multi-tenant** (cada admin gerencia uma república isolada das demais — ver [docs/architecture.md](architecture.md)). O backend em Node.js + Express + TypeScript expõe uma API que persiste dados em MongoDB, com autenticação JWT e controle de acesso por papel (admin/resident). O frontend em React + Vite consome essa API e já tem todas as telas principais funcionais. Toda a infraestrutura é containerizada com Docker Compose.

O desenvolvimento segue um planejamento de 10 sprints semanais. Esta página documenta o estado atual de cada sprint.

---

## Progresso por Sprint

### Configuração — ✅ Concluído

Ambiente completamente containerizado com Docker Compose: backend (porta 3001), frontend (porta 5173) e MongoDB (porta 27017, exposta em 27018 no host). Backend em TypeScript, compilado via `tsc`, com `tsx watch` no modo dev. Conexão com MongoDB via padrão Singleton.

### Sprint 1 — Módulo de Despesas — ✅ Concluído

`GET/POST/PUT/DELETE /api/expenses` com filtros dinâmicos via query string: categoria, valor mínimo/máximo, busca por descrição, intervalo de datas. O cadastro/edição aceita `proofUrl` para guardar a URL externa do comprovante (Drive/S3/imagem/PDF); o projeto não hospeda arquivos binários. Despesas comuns entram na divisão entre moradores; extras não. Categorias via enum `ExpenseCategory`: Moradia, Alimentação, Transporte, Utilidades, Limpeza, Internet, Pets e Outros. Resultados paginados.

### Sprint 2 — Categorias e Orçamentos — ✅ Concluído (cresceu além do previsto)

- **Categorias** (`GET/POST/DELETE /api/categories`) — deixaram de ser só o enum fixo: agora são customizadas por república, com verificação de nome duplicado (409).
- **Orçamentos** (`/api/budgets`) — foi bem além do CRUD original planejado:
  - `GET/POST/DELETE /templates` — modelos reutilizáveis de gasto (ex.: "Conta de Luz") configuráveis pelo admin.
  - `GET /:year/:month` — orçamentos planejados do mês + total + divisão por pessoa.
  - `POST /simulate/:year/:month` — instancia os templates configurados como orçamento do mês, idempotente por descrição.
  - `POST /:id/apply` — converte um orçamento planejado em despesa real.
  - `PUT/DELETE /:id` — ajusta valor ou remove um orçamento planejado.

### Sprint 3 — Pagamentos e Fechamento Mensal (Parte 1) — ✅ Concluído

`GET/POST/DELETE /api/payments` — registro de pagamentos com `residentId`, `month` (`YYYY-MM`) e `amount`. **Rota pública** — não passa por `authMiddleware`, diferente do padrão do resto da API (ver gaps abaixo).

### Sprint 4 — Fechamento Mensal (Parte 2) e Relatórios — ✅ Concluído

- **Fechamento mensal** (`/api/monthly-balance`) — reescrito para path params (`/:year/:month`) em vez de query string:
  - `GET /:year/:month` — painel completo: recalcula a cota de cada morador ativo, saldo anterior, pagamentos e saldo restante; persiste o resultado.
  - `PUT /:year/:month/:residentId/status` — ativa/inativa um morador só naquele mês, sem afetar o cadastro.
  - `PUT`/`DELETE /:year/:month/:residentId/proportional` — define/remove o dia de saída do morador no mês, recalculando o **cálculo proporcional** (item que era "falta implementar" na versão anterior desta página — já está pronto).
  - `POST /:year/:month/:residentId/payment` e `DELETE /payment/:paymentId` — lançamento de pagamento pelo fechamento.

  A cota é dividida pelo peso proporcional total dos moradores ativos (soma dos fatores, não a contagem de cabeças): `currentMonthDue = monthlyShare × proportionalFactor`; `remainingBalance = previousBalance + currentMonthDue − totalPaid`.

- **Relatórios** (`GET /api/reports/monthly`) — despesas totais e por categoria, total arrecadado, total pendente, moradores adimplentes/inadimplentes e taxa de adimplência. **Rota pública** — mesmo gap de `payments`.

### Sprint 5 — Autenticação JWT — ✅ Concluído

Estava listada como pendente na versão anterior desta página — já está pronta. JWT (biblioteca `jose`, HS256) com senha em hash argon2. `POST /api/auth/register` cria uma conta **admin** com uma república nova (`republicId` gerado); `POST /login` autentica por nickname; `GET /me` e `POST /change-password` exigem token. Sessão restaurada automaticamente no frontend a partir do token salvo, revalidando contra `/me`.

### Sprint 6 — Moradores (categorias) e RBAC — ✅ Concluído

Também estava listada como pendente — já está pronta.

- **Moradores** (`GET/POST/PUT /api/residents`) — nickname (único), nome completo, WhatsApp, categoria (`Bixo`, `Agregado` ou `Morador` — só admin altera) e senha (com troca obrigatória no primeiro acesso se gerada automaticamente). `GET /api/residents?search=` busca por nome completo ou apelido. **Não há mais exclusão nem desativação de cadastro** — o repository não expõe `delete`, para preservar o histórico de pagamentos. A "saída" de um morador é tratada só no contexto de um mês específico, pelo módulo de fechamento, sem afetar o cadastro global.
- **RBAC** — papéis `admin` e `resident`, aplicados via middleware `authorize(...roles)` em cada rota. Admin gerencia moradores, despesas de terceiros, categorias, orçamentos e lançamentos do fechamento mensal; morador comum só visualiza e edita o próprio cadastro. `usePermissions` espelha essas regras no frontend.

### Sprints 7–9 — Interface Visual (React) — ✅ Concluído

Estava listada como a maior parte do trabalho restante — hoje todas as telas principais estão implementadas e consumindo a API real, sem mock: `Landing` (login/registro), `MonthlyDashboard`, `Residents`, `Expenses`, `Budgets`, `Analytics` e `ChangePassword`, dentro de um `DashboardLayout` comum. Roteamento com `react-router-dom`, sessão via `AuthContext`, permissões via `usePermissions`, e uma rota privada que redireciona para troca de senha obrigatória quando necessário.

### Sprint 10 — Testes, refinamentos e entrega — 🔄 Em andamento

- **Testes automatizados** — 135 testes no backend + 31 no frontend, CI ativo no GitHub Actions rodando typecheck + testes + cobertura + build em push/PR (ver [docs/testes.md](testes.md)).
- **Seed de dados** — `backend/src/database/seed.ts` (`pnpm db:seed`), populando ~3 meses de dados de demonstração (moradores, despesas, pagamentos, saldos, categorias, templates de orçamento) e migrando registros antigos sem os campos de auth/RBAC/categoria.
- Ainda falta: lint no CI, middleware de erro global e testes das demais páginas do frontend (ver gaps abaixo) — por isso o status é "em andamento", não "concluído".

### Extra — fora do planejamento original de 10 sprints

**Multi-tenancy por república** — ✅ Concluído. Não estava no plano inicial: cada conta que se registra vira admin de uma república isolada (`republicId`), e toda consulta que lista dados filtra por esse id. Ver [docs/architecture.md](architecture.md) para detalhes.

---

## Gaps conhecidos

### Rotas sem autenticação

`POST/GET/DELETE /api/payments` e `GET /api/reports/monthly` não exigem token, diferente do resto da API. Achado durante os testes de integração, não corrigido (fora do escopo daquela tarefa).

### Middleware de erro global

Não existe um middleware de erro central em `createApp.ts`. Erros de validação lançados pelas factories (`ExpenseFactory`, `PaymentFactory`) dentro de uma rota não viram `400` — chegam ao handler padrão do Express e retornam `500`.

### Lint no CI

`backend` e `frontend` têm script `lint` (`eslint`), mas nenhum dos dois tem arquivo de configuração do ESLint no repositório — `pnpm lint` falha hoje em qualquer branch. Por isso o step de lint foi deixado fora do workflow de CI.

### Testes de páginas do frontend

`services/api.ts` e as páginas maiores `Expenses`, `MonthlyDashboard`, `Budgets` e `Analytics` ainda não têm testes automatizados; `Residents` já tem cobertura pontual para busca e modo de formulário — a Fase 3 de testes cobriu hooks, contexto de autenticação e componentes reutilizáveis, mas não as páginas em si (300–500 linhas cada, com bastante estado local).

### Responsável do mês

Existia uma ideia de "responsável mensal" por república — foi removida do backend em algum momento (`GET /monthly-balance/:year/:month` retorna `manager: null` com um comentário explícito de que o módulo não existe mais). Não está nos planos atuais, citado aqui só para não confundir quem vir o campo `manager` na resposta.

---

## Resumo

| Sprint | Tema | Status |
|--------|------|--------|
| Configuração | Ambiente, Docker, banco de dados, models | ✅ Concluído |
| Sprint 1 | Módulo de Despesas (CRUD + filtros) | ✅ Concluído |
| Sprint 2 | Categorias e Orçamentos | ✅ Concluído — expandido (templates, simulação, aplicação) |
| Sprint 3 | Pagamentos e Fechamento Mensal (Parte 1) | ✅ Concluído — RBAC pendente em `payments` |
| Sprint 4 | Fechamento Mensal (Parte 2) e Relatórios | ✅ Concluído — inclui cálculo proporcional; RBAC pendente em `reports` |
| Sprint 5 | Autenticação JWT | ✅ Concluído |
| Sprint 6 | Moradores (categorias) e RBAC | ✅ Concluído |
| Sprints 7–9 | Interface visual (React) | ✅ Concluído |
| Sprint 10 | Testes, refinamentos e entrega | 🔄 Em andamento — falta lint no CI, middleware de erro global e testes de páginas do frontend |
| Extra | Multi-tenancy por república | ✅ Concluído (fora do planejamento original) |
