# Arquitetura do Sistema — Caixinha App

> Última atualização: Julho de 2026

## Visão Geral

O Caixinha App é uma aplicação web full-stack containerizada com Docker. O backend é uma API REST em Node.js + Express + TypeScript que persiste dados em MongoDB. O frontend é uma SPA em React + Vite que consome a API. Autenticação é feita via JWT (Bearer token) e o sistema é **multi-tenant**: cada conta administradora representa uma república isolada das demais.

```
Cliente (Browser)
      │
      ▼
Frontend React (porta 5173)
      │  HTTP/REST + Bearer JWT
      ▼
Backend Express (porta 3001)
      │  Driver MongoDB
      ▼
MongoDB (porta 27017 / 27018 externo via Docker)
```

---

## Conceito central: multi-tenancy por república

Não existe cadastro de "repúblicas" como entidade própria. Em vez disso:

- Quem se registra em `POST /api/auth/register` vira **admin** de uma república nova — recebe um `republicId` gerado (`randomUUID()`) e não é um morador (não entra na divisão de despesas nem aparece em `/api/residents`).
- O admin cadastra moradores (`role: 'resident'`) através de `POST /api/residents`, todos vinculados ao mesmo `republicId`.
- Toda consulta que lista dados (moradores, despesas, categorias, orçamentos, saldos) filtra por `req.user.republicId` — isso é o que garante que a conta de uma república não vê dados de outra. Não há um único banco de dados "global" compartilhado entre repúblicas: é isolamento por linha (row-level), não por schema/banco separado.
- O JWT carrega `sub` (id do usuário), `role` e `republicId` — é a partir dele que toda rota autenticada sabe de qual república tratar.

Esse conceito não existia nas versões anteriores do sistema (o cadastro de moradores era global) e é a mudança estrutural mais importante desde a última revisão desta documentação.

---

## Estrutura de Pastas

```
gerencia_caixinha_republica/
├── backend/                    # API REST Node.js
│   ├── src/
│   │   ├── app/                 # Configuração central do Express
│   │   ├── config/               # Conexão com banco de dados
│   │   ├── database/             # Script de seed
│   │   ├── factories/            # Criação e validação de entidades
│   │   ├── models/               # Interfaces TypeScript (contratos de dados)
│   │   ├── modules/              # Rotas HTTP organizadas por domínio
│   │   ├── repositories/         # Acesso ao MongoDB por entidade
│   │   ├── scripts/              # Utilitários de linha de comando (geração de chaves/hash)
│   │   └── shared/                # JWT, middlewares
│   ├── tests/                    # Testes unitários e de integração (ver docs/testes.md)
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/                    # SPA React + Vite
│   └── src/
│       ├── pages/                 # Telas: Landing, MonthlyDashboard, Residents, Expenses, Budgets, Analytics, ChangePassword
│       ├── components/            # DashboardLayout, Button, ActionButton, Notification, ResidentCard, ResidentBalanceCard
│       ├── contexts/              # AuthContext (sessão)
│       ├── hooks/                 # usePermissions (RBAC no client)
│       ├── services/              # api.ts (axios + interceptors)
│       └── styles/
├── docs/                         # Documentação do projeto
├── docker-compose.yml            # Orquestração dos containers
├── .env.example                  # Variáveis de ambiente necessárias
└── run.sh                        # Script de inicialização
```

---

## Backend — Camadas da Arquitetura

```
Requisição HTTP
      │
      ▼
authMiddleware          ← valida o JWT, revalida o usuário no Mongo, popula req.user
      │
      ▼
authorize(...roles)     ← RBAC: bloqueia por papel (admin / resident)
      │
      ▼
   Rotas (modules/)      ← recebe req, chama factory + repository
      │
      ├──▶ Factory        ← valida e monta o objeto da entidade
      │
      └──▶ Repository     ← persiste ou busca no MongoDB, sempre filtrando por republicId
                │
                ▼
           MongoDB (via DatabaseConnection)
```

### `src/app/`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `createApp.ts` | Monta a instância do Express com middlewares (helmet, cors, json) e registra o router principal em `/api` |
| `routes.ts` | Registra todos os sub-routers de cada módulo no router principal |
| `appContext.ts` | Instancia os repositories uma única vez (`residentRepo`, `expenseRepo`, `paymentRepo`, `monthlyBalanceRepo`, `categoryRepo`, `budgetRepo`, `budgetTemplateRepo`) e exporta para uso nas rotas |

### `src/config/`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `database.ts` | Padrão Singleton para a conexão com o MongoDB — uma única conexão ativa durante o ciclo de vida da aplicação |

### `src/models/`

Interfaces TypeScript puras — sem lógica, sem banco.

| Arquivo | O que define |
|---------|-------------|
| `Resident.ts` | `IResident` (inclui `role`, `category`, `republicId`, `passwordHash`, `mustChangePassword`), `Role` (`'admin' \| 'resident'`), `ResidentCategory` (`'Bixo' \| 'Agregado' \| 'Morador'`) |
| `Expense.ts` | `IExpense`, `ExpenseCategory` (enum: Moradia, Alimentação, Transporte, Utilidades, Limpeza, Internet, Pets, Outros) |
| `Payment.ts` | `IPayment` |
| `MonthlyBalance.ts` | `IMonthlyBalance` (guarda `isActive`/`exitDay`/`proportionalFactor` por morador e por mês) |
| `Budget.ts` | `IBudget` — orçamento planejado (mês/ano, `isApplied`, `appliedExpenseId`) |
| `BudgetTemplate.ts` | `IBudgetTemplate` — modelos reutilizáveis de gasto (ex.: "Conta de Luz") usados para simular um mês |
| `Category.ts` | `ICategory` — categorias de despesa customizadas por república |

### `src/factories/`

| Arquivo | Valida e cria |
|---------|--------------|
| `ResidentFactory.ts` | Morador — nickname/fullName obrigatórios, hash argon2 da senha, categoria padrão `Bixo` |
| `ExpenseFactory.ts` | Despesa — `description`, `amount` (> 0), `category`, `expenseDate` obrigatórios |
| `PaymentFactory.ts` | Pagamento — `residentId`, `amount` (> 0), `month` no formato `YYYY-MM` |

### `src/repositories/`

Cada repository encapsula as operações de banco de uma entidade e filtra por `republicId` quando aplicável.

| Arquivo | Coleção MongoDB | Observações |
|---------|----------------|---------------------|
| `ResidentRepository.ts` | `residents` | `findAll`, `findById`, `save`, `update`. **Não há mais `delete`** — não existe remoção nem desativação de morador via API (ver seção Auth/RBAC abaixo) |
| `ExpenseRepository.ts` | `expenses` | `findAll` (paginado + filtros), `findById`, `save`, `update`, `delete` |
| `PaymentRepository.ts` | `payments` | `findByMonth`, `findByResidentAndMonth`, `save`, `delete` |
| `MonthlyBalanceRepository.ts` | `monthlyBalances` | `findByMonth`, `findByResidentAndMonth`, `upsert` |
| `CategoryRepository.ts` | `categories` | `findAllByRepublic`, `findByNameAndRepublic`, `create`, `delete` |
| `BudgetRepository.ts` | `budgets` | `findByMonth`, `findByDescriptionForMonth`, `findById`, `create`, `update`, `delete` |
| `BudgetTemplateRepository.ts` | `budgetTemplates` | `findAllByRepublic`, `create`, `delete` |
| `IRepository.ts` | — | Interface genérica de contrato |

### `src/modules/`

Cada módulo contém as rotas HTTP de um domínio, registradas em `app/routes.ts` sob `/api`.

| Módulo | Prefixo | Auth | Endpoints |
|--------|---------|------|-----------|
| `auth/` | `/api/auth` | público (exceto `/me`, `/change-password`) | `POST /register` (cria admin + república nova), `POST /login`, `POST /logout`, `GET /me` 🔒, `POST /change-password` 🔒 |
| `residents/` | `/api/residents` | 🔒 admin+resident (leitura), admin (criação) | `GET /` (paginado, exclui o admin), `POST /` (admin only, gera senha temporária se não informada), `PUT /:id` (o próprio morador ou admin; só admin muda `category`) |
| `expenses/` | `/api/expenses` | 🔒 admin+resident | `GET /` (filtros: category, minAmount, maxAmount, search, startDate, endDate), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `categories/` | `/api/categories` | 🔒 admin+resident (leitura), admin (escrita) | `GET /`, `POST /` (409 se nome duplicado na república), `DELETE /:id` |
| `budgets/` | `/api/budgets` | 🔒 | `GET/POST/DELETE /templates` (modelos reutilizáveis), `GET /:year/:month` (orçamentos do mês + divisão por pessoa), `POST /simulate/:year/:month` (instancia os templates como orçamento do mês, idempotente por descrição), `POST /:id/apply` (converte orçamento em despesa real), `PUT /:id`, `DELETE /:id` |
| `payments/` | `/api/payments` | **público — sem authMiddleware** | `GET /?month=&residentId=`, `POST /`, `DELETE /:id` |
| `monthly-balance/` | `/api/monthly-balance` | 🔒 | `GET /:year/:month` (painel completo: saldo por morador, despesas do mês, cota por pessoa — recalcula a cada chamada), `PUT /:year/:month/:residentId/status` (ativa/inativa o morador só naquele mês, admin), `PUT`/`DELETE /:year/:month/:residentId/proportional` (define/remove dia de saída → fator proporcional, admin), `POST /:year/:month/:residentId/payment` (admin), `DELETE /payment/:paymentId` (admin) |
| `reports/` | `/api/reports` | **público — sem authMiddleware** | `GET /monthly?year=&month=` (despesas por categoria, total arrecadado/pendente, taxa de adimplência) |

> 🔒 = exige `Authorization: Bearer <token>` via `authMiddleware`. `payments` e `reports/monthly` são as duas exceções conhecidas — não foi uma decisão de design, é um gap real encontrado durante os testes de integração (ver `docs/testes.md`).

### `src/modules/monthly-balance/monthlyBalance.utils.ts`

Funções puras de cálculo financeiro, sem dependência de banco:

- `calculateMonthlyShare(expenses, totalProportionalWeight)` — divide o total das despesas **comuns** pelo **peso proporcional total** dos moradores ativos no mês (soma dos `proportionalFactor`, não a contagem de cabeças). Quem saiu no meio do mês paga proporcionalmente menos, e a diferença é redistribuída entre os demais ativos — a soma de todas as cotas sempre fecha com o total das despesas do mês.
- `computeProportionalFactor(exitDay, totalDaysInMonth)` — fator entre 0 e 1 baseado no dia de saída (`exitDay` nulo/indefinido = mês inteiro, fator 1).
- `daysInMonth(year, month)` — considera anos bissextos.
- `toMonthKey(year, month)` — formata `(2026, 6)` em `'2026-06'`.

A fórmula final por morador, aplicada em `monthlyBalance.routes.ts`:
```
currentMonthDue    = isActive ? monthlyShare * proportionalFactor : 0
totalDue           = previousBalance + currentMonthDue
remainingBalance   = totalDue - totalPaid
```

### `src/shared/`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `jwt.ts` | `signAccessToken`/`verifyAccessToken` (biblioteca `jose`, HS256), payload `{ sub, role, republicId }`, expiração configurável via `JWT_EXPIRES_IN` |
| `middlewares/authMiddleware.ts` | Lê o header `Authorization: Bearer <token>`, verifica o JWT e **revalida contra o banco** (busca o usuário por `_id` com `isActive: true`) antes de popular `req.user` — garante que desativação/mudança de papel se reflita imediatamente, mesmo com um token ainda válido |
| `middlewares/authorize.ts` | RBAC: recebe uma lista de papéis permitidos (`authorize('admin')`, `authorize('admin', 'resident')`) e retorna 403 se o papel do usuário autenticado não estiver na lista |
| `middlewares/asyncHandler.ts` | Wrapper para rotas async — captura exceções e repassa para o handler de erro do Express via `next(error)` |

---

## Autenticação e Autorização — como funciona

1. **Registro** (`POST /api/auth/register`): cria um usuário `role: 'admin'` com um `republicId` novo (`randomUUID()`). O `fullName` inicial é igual ao `nickname`. Retorna `accessToken` + dados do usuário.
2. **Login** (`POST /api/auth/login`): recebe `identifier` (nickname) + `password`, verifica o hash argon2, retorna `accessToken`.
3. **Requisições autenticadas**: o frontend injeta `Authorization: Bearer <token>` em toda chamada (interceptor do axios em `services/api.ts`). O `authMiddleware` decodifica o JWT e faz uma consulta ao Mongo para confirmar que o usuário ainda existe e está ativo — não confia cegamente no payload do token.
4. **RBAC**: cada rota declara explicitamente quais papéis podem acessá-la via `authorize(...)`. Só `admin` cria/edita moradores, despesas de outros, categorias, orçamentos e lança pagamentos pelo fechamento mensal; `resident` só visualiza e edita o próprio cadastro.
5. **Troca de senha obrigatória**: moradores criados pelo admin recebem `mustChangePassword: true` e uma senha temporária gerada (`generateTempPassword`). O frontend redireciona para `/change-password` enquanto essa flag estiver ativa (`PrivateRoute` em `App.tsx`).
6. **Sem remoção de morador**: não existe endpoint de exclusão nem de desativação de cadastro — desativar removeria o histórico de pagamentos vinculado. A "saída" de um morador é tratada só no contexto de um mês específico, via `PUT /monthly-balance/:year/:month/:residentId/status` ou `.../proportional`, sem afetar o cadastro global.

---

## Frontend — Estrutura

O React consome a API via `services/api.ts` (instância axios com `baseURL` de `VITE_API_URL`), guarda o token em `localStorage` (`caixinha_token`) e o expõe pelo `AuthContext`.

| Camada | Arquivo(s) | Responsabilidade |
|--------|-----------|-------------------|
| Roteamento | `App.tsx` | `BrowserRouter` com rota pública (`/`, `/change-password`) e um bloco protegido por `PrivateRoute` (verifica `isAuthenticated` e `mustChangePassword` antes de renderizar) |
| Sessão | `contexts/AuthContext.tsx` | Restaura a sessão a partir do token salvo (revalida com `GET /auth/me`), expõe `login`/`register`/`logout`/`updateResident` |
| Permissões | `hooks/usePermissions.ts` | Espelha o RBAC do backend no client: `admin` pode gerenciar tudo, `resident` só visualiza — usado para esconder botões de ação na UI |
| Layout | `components/DashboardLayout.tsx` | Casca comum das telas autenticadas (navegação entre `/monthly`, `/residents`, `/expenses`, `/budgets`, `/analytics`) |
| Telas | `pages/Landing.tsx`, `MonthlyDashboard.tsx`, `Residents.tsx`, `Expenses.tsx`, `Budgets.tsx`, `Analytics.tsx`, `ChangePassword.tsx` | Uma tela por domínio funcional — todas consomem a API real, sem mock |
| Componentes reutilizáveis | `components/Button.tsx`, `ActionButton.tsx`, `Notification.tsx`, `ResidentCard.tsx`, `ResidentBalanceCard.tsx` | Blocos de UI usados em mais de uma tela |

---

## Fluxo funcional de ponta a ponta

Um exemplo de ciclo mensal completo, ligando os módulos:

1. Um usuário se registra (`/auth/register`) e vira admin de uma república nova.
2. O admin cadastra os moradores (`/residents`), cada um recebendo uma senha temporária.
3. Ao longo do mês, despesas comuns e extras são lançadas (`/expenses`) — opcionalmente a partir de um orçamento planejado e "aplicado" (`/budgets/:id/apply`).
4. Pagamentos avulsos podem ser lançados por `/payments` ou diretamente pelo fechamento (`/monthly-balance/:year/:month/:residentId/payment`).
5. A qualquer momento, `GET /monthly-balance/:year/:month` recalcula a cota de cada morador ativo (dividindo as despesas comuns pelo peso proporcional total), soma o saldo do mês anterior e subtrai os pagamentos já feitos — e persiste o resultado em `monthlyBalances`.
6. `GET /reports/monthly` consolida o mês: despesas por categoria, total arrecadado/pendente e taxa de adimplência.

---

## Padrões Utilizados

**Singleton** — `DatabaseConnection` garante uma única conexão com o MongoDB durante toda a execução.

**Factory** — cada entidade tem sua factory que centraliza validação e criação, evitando código duplicado nas rotas.

**Repository** — isola o acesso ao banco de dados das rotas; a maioria filtra implicitamente por `republicId`.

**Multi-tenancy por linha (row-level)** — um único banco de dados compartilhado entre repúblicas, isolado por `republicId` em cada consulta — não é isolamento por schema/banco separado.

**RBAC declarativo** — `authorize(...roles)` como middleware explícito em cada rota, em vez de checagem de papel espalhada no corpo dos handlers.

---

## Variáveis de Ambiente

Definidas no `.env` (baseado em `.env.example`):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor backend | `3001` |
| `NODE_ENV` | Ambiente de execução | `development` |
| `MONGODB_URI` | String de conexão com o MongoDB | `mongodb://admin:password@localhost:27017/caixinha?authSource=admin` |
| `CORS_ORIGIN` | Origem permitida pelo CORS do backend | `http://localhost:5173` |
| `VITE_API_URL` | URL da API consumida pelo frontend | `http://localhost:3001` |
| `JWT_SECRET` | Segredo usado para assinar os JWTs (gerar com `openssl rand -hex 32`) | — |
| `JWT_EXPIRES_IN` | Tempo de expiração do access token | `8h` |

---

Tecnologia de testes: **Vitest** (backend e frontend — ver [docs/testes.md](testes.md)).
