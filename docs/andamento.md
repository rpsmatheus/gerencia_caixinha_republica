# Andamento do Projeto — Caixinha App

> Última atualização: Julho de 2026

---

## Visão Geral

O Caixinha App é um sistema web para gestão financeira de repúblicas estudantis, desenvolvido com arquitetura REST API + SPA, **multi-tenant** (cada admin gerencia uma república isolada das demais — ver [docs/architecture.md](architecture.md)). O backend em Node.js + Express + TypeScript expõe uma API que persiste dados em MongoDB, com autenticação JWT e controle de acesso por papel (admin/resident). O frontend em React + Vite consome essa API e já tem todas as telas principais funcionais. Toda a infraestrutura é containerizada com Docker Compose.

O planejamento original previa 10 sprints semanais; o escopo cresceu além do previsto em vários módulos (autenticação, orçamentos, fechamento mensal), então esta página descreve o estado atual por módulo em vez de seguir estritamente a numeração original das sprints.

---

## Módulos Implementados

### Infraestrutura e Configuração

Ambiente completamente containerizado com Docker Compose: backend (porta 3001), frontend (porta 5173) e MongoDB (porta 27017, exposta em 27018 no host). Backend em TypeScript, compilado via `tsc`, com `tsx watch` no modo dev. Conexão com MongoDB via padrão Singleton.

### Autenticação — `/api/auth`

JWT (biblioteca `jose`, HS256) com senha em hash argon2. `POST /register` cria uma conta **admin** com uma república nova (`republicId` gerado); `POST /login` autentica por nickname; `GET /me` e `POST /change-password` exigem token. Sessão restaurada automaticamente no frontend a partir do token salvo, revalidando contra `/me`.

### Controle de Acesso — RBAC

Papéis `admin` e `resident`, aplicados via middleware `authorize(...roles)` em cada rota. Admin gerencia moradores, despesas de terceiros, categorias, orçamentos e lançamentos do fechamento mensal; morador comum só visualiza e edita o próprio cadastro. `usePermissions` espelha essas regras no frontend para esconder ações não permitidas.

**Gap conhecido:** `POST /api/payments` e `GET /api/reports/monthly` não passam por `authMiddleware` — ficaram públicas, ao contrário do padrão do resto da API. Não corrigido ainda (ver [docs/testes.md](testes.md)).

### Módulo de Moradores — `GET/POST/PUT /api/residents`

Cada morador tem nickname (único), nome completo, WhatsApp, categoria (`Bixo`, `Agregado` ou `Morador` — só admin altera) e senha (argon2, com troca obrigatória no primeiro acesso se gerada automaticamente). **Não há mais exclusão nem desativação de cadastro** — o repository não expõe `delete`; isso preservaria o histórico de pagamentos. A "saída" de um morador é tratada só no contexto de um mês específico, pelo módulo de fechamento (`PUT /monthly-balance/.../status`), sem afetar o cadastro global.

### Módulo de Despesas — `GET/POST/PUT/DELETE /api/expenses`

Filtros dinâmicos via query string: categoria, valor mínimo/máximo, busca por descrição, intervalo de datas. Despesas comuns entram na divisão entre moradores; extras não. Categorias via enum `ExpenseCategory`: Moradia, Alimentação, Transporte, Utilidades, Limpeza, Internet, Pets e Outros. Resultados paginados.

### Módulo de Categorias — `GET/POST/DELETE /api/categories`

Categorias de despesa **customizadas por república** (não é mais só o enum fixo) — admin pode criar e remover, com verificação de nome duplicado (409).

### Módulo de Orçamentos — `/api/budgets`

Cresceu bem além do CRUD original:
- `GET/POST/DELETE /templates` — modelos reutilizáveis de gasto (ex.: "Conta de Luz") configuráveis pelo admin.
- `GET /:year/:month` — orçamentos planejados do mês + total + divisão por pessoa.
- `POST /simulate/:year/:month` — instancia os templates configurados como orçamento do mês, idempotente por descrição (não duplica se já simulado).
- `POST /:id/apply` — converte um orçamento planejado em despesa real (bloqueia se já aplicado).
- `PUT/DELETE /:id` — ajusta valor ou remove um orçamento planejado.

### Módulo de Pagamentos — `GET/POST/DELETE /api/payments`

Registro de pagamentos com `residentId`, `month` (`YYYY-MM`) e `amount`. Rota pública (ver gap de RBAC acima).

### Módulo de Fechamento Mensal — `/api/monthly-balance`

Módulo central do sistema, reescrito para path params (`/:year/:month`) em vez de query string. Endpoints:

- `GET /:year/:month` — painel completo: recalcula a cota de cada morador ativo, saldo anterior, pagamentos e saldo restante; persiste o resultado.
- `PUT /:year/:month/:residentId/status` — ativa/inativa um morador **só naquele mês**, sem afetar o cadastro.
- `PUT`/`DELETE /:year/:month/:residentId/proportional` — define/remove o dia de saída do morador no mês, recalculando o **cálculo proporcional** (fator entre 0 e 1 conforme os dias restidos no mês).
- `POST /:year/:month/:residentId/payment` e `DELETE /payment/:paymentId` — lançamento de pagamento pelo fechamento.

A cota é dividida pelo **peso proporcional total** dos moradores ativos (soma dos fatores, não a contagem de cabeças), então quem saiu no meio do mês paga proporcionalmente menos e a diferença é redistribuída entre os demais — a soma das cotas sempre fecha com o total de despesas comuns do mês. Fórmula final: `currentMonthDue = monthlyShare × proportionalFactor`; `remainingBalance = previousBalance + currentMonthDue − totalPaid`.

### Módulo de Relatórios — `GET /api/reports/monthly`

Relatório consolidado: despesas totais e por categoria, total arrecadado, total pendente, moradores adimplentes/inadimplentes e taxa de adimplência.

### Seed de dados

`backend/src/database/seed.ts` (`pnpm db:seed`), populando ~3 meses de dados de demonstração — moradores, despesas, pagamentos, saldos, categorias e templates de orçamento. Também migra registros antigos sem os campos de auth/RBAC/categoria.

### Interface visual (Frontend)

Todas as telas principais estão implementadas e consumindo a API real, sem mock: `Landing` (login/registro), `MonthlyDashboard`, `Residents`, `Expenses`, `Budgets`, `Analytics` e `ChangePassword`, dentro de um `DashboardLayout` comum. Roteamento com `react-router-dom`, sessão via `AuthContext`, permissões via `usePermissions`, e uma rota privada que redireciona para troca de senha obrigatória quando necessário.

---

## O que ainda falta / gaps conhecidos

### Rotas sem autenticação

`POST /api/payments` (e `GET`/`DELETE`) e `GET /api/reports/monthly` não exigem token, diferente do resto da API. Achado durante os testes de integração, não corrigido (fora do escopo daquela tarefa).

### Middleware de erro global

Não existe um middleware de erro central em `createApp.ts`. Erros de validação lançados pelas factories (`ExpenseFactory`, `PaymentFactory`) dentro de uma rota não viram `400` — chegam ao handler padrão do Express e retornam `500`.

### Lint no CI

`backend` e `frontend` têm script `lint` (`eslint`), mas nenhum dos dois tem arquivo de configuração do ESLint no repositório — `pnpm lint` falha hoje em qualquer branch. Por isso o step de lint foi deixado fora do workflow de CI (ver [docs/testes.md](testes.md)).

### Testes de páginas do frontend

`services/api.ts` e as páginas maiores (`Residents`, `Expenses`, `MonthlyDashboard`, `Budgets`, `Analytics`) ainda não têm testes automatizados — a Fase 3 de testes cobriu hooks, contexto de autenticação e componentes reutilizáveis, mas não as páginas em si (300–500 linhas cada, com bastante estado local).

### Responsável do mês

Existia uma ideia de "responsável mensal" por república — foi removida do backend em algum momento (`GET /monthly-balance/:year/:month` retorna `manager: null` com um comentário explícito de que o módulo não existe mais). Não está nos planos atuais, citado aqui só para não confundir quem vir o campo `manager` na resposta.

---

## Progresso por módulo

| Módulo | Status |
|--------|--------|
| Infraestrutura, Docker, banco de dados, models | ✅ Concluído |
| Despesas (CRUD + filtros) | ✅ Concluído |
| Categorias (customizadas por república) | ✅ Concluído |
| Orçamentos (templates, simulação, aplicação) | ✅ Concluído |
| Pagamentos e Fechamento Mensal (com cálculo proporcional) | ✅ Concluído — RBAC pendente em `payments` |
| Relatórios | ✅ Concluído — RBAC pendente |
| Autenticação JWT | ✅ Concluído |
| RBAC (admin/resident) | ✅ Concluído — exceto os dois gaps citados acima |
| Categorização de moradores (Bixo/Agregado/Morador) | ✅ Concluído |
| Multi-tenancy por república | ✅ Concluído |
| Interface visual (React) — todas as telas | ✅ Concluído |
| Seed de dados de demonstração | ✅ Concluído |
| Testes automatizados (backend + frontend) + CI | ✅ Concluído — 127 testes backend + 28 frontend (ver [docs/testes.md](testes.md)) |
| Lint no CI | ⏳ Pendente — falta configuração do ESLint |
| Middleware de erro global | ⏳ Pendente |
| Testes de páginas do frontend | ⏳ Pendente |
