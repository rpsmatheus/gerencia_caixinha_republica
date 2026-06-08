# Arquitetura do Sistema — Caixinha App

## Visão Geral

O Caixinha App é uma aplicação web full-stack containerizada com Docker. O backend é uma API REST em Node.js + Express + TypeScript que persiste dados em MongoDB. O frontend é uma SPA em React + Vite que consome a API.

A comunicação segue o fluxo:

```
Cliente (Browser)
      │
      ▼
Frontend React (porta 5173)
      │  HTTP/REST
      ▼
Backend Express (porta 3001)
      │  Driver MongoDB
      ▼
MongoDB (porta 27017)
```

---

## Estrutura de Pastas

```
gerencia_caixinha_republica/
├── backend/                    # API REST Node.js
│   ├── src/
│   │   ├── app/                # Configuração central do Express
│   │   ├── config/             # Conexão com banco de dados
│   │   ├── factories/          # Criação e validação de entidades
│   │   ├── models/             # Interfaces TypeScript (contratos de dados)
│   │   ├── modules/            # Rotas HTTP organizadas por domínio
│   │   ├── repositories/       # Acesso ao MongoDB por entidade
│   │   └── shared/             # Utilitários compartilhados
│   ├── tests/                  # Testes unitários e de integração
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/                   # SPA React + Vite
│   └── src/
├── docs/                       # Documentação do projeto
├── docker-compose.yml          # Orquestração dos containers
├── .env.example                # Variáveis de ambiente necessárias
└── run.sh                      # Script de inicialização
```

---

## Backend — Camadas da Arquitetura

O backend segue uma arquitetura em camadas, onde cada camada tem responsabilidade única:

```
Requisição HTTP
      │
      ▼
   Rotas (modules/)          ← recebe req, chama factory + repository
      │
      ├──▶ Factory           ← valida e monta o objeto da entidade
      │
      └──▶ Repository        ← persiste ou busca no MongoDB
                │
                ▼
           MongoDB (via DatabaseConnection)
```

### `src/app/`

Configuração central do servidor Express.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `createApp.ts` | Monta a instância do Express com middlewares (helmet, cors, json) e registra o router principal em `/api` |
| `routes.ts` | Registra todos os sub-routers de cada módulo no router principal |
| `appContext.ts` | Instancia os repositories uma única vez e exporta para uso nas rotas |

### `src/config/`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `database.ts` | Implementa o padrão Singleton para a conexão com o MongoDB. Garante que apenas uma conexão ativa exista durante o ciclo de vida da aplicação |

### `src/models/`

Interfaces TypeScript puras — sem lógica, sem banco. Definem o contrato de dados de cada entidade.

| Arquivo | O que define |
|---------|-------------|
| `Resident.ts` | `IResident`, `ICreateResidentDTO`, `IUpdateResidentDTO`, `IResidentFilter` |
| `Expense.ts` | `IExpense`, `ExpenseCategory` (enum), `ICreateExpenseDTO`, `IExpenseFilter`, `IExpenseSummary` |
| `Payment.ts` | `IPayment`, `ICreatePaymentDTO` |
| `MonthlyBalance.ts` | `IMonthlyBalance`, `ICreateMonthlyBalanceDTO`, `IUpdatePaymentDTO`, `IMonthlyBalanceSummary`, `IMonthlyReport` |
| `Budget.ts` | `IBudget` |

### `src/factories/`

Responsáveis por criar e validar objetos antes de salvá-los. Cada factory recebe um DTO, valida os campos obrigatórios, gera o UUID e retorna o objeto completo pronto para persistência.

| Arquivo | Valida e cria |
|---------|--------------|
| `ResidentFactory.ts` | Morador — valida nickname e fullName, converte nickname para minúsculas |
| `ExpenseFactory.ts` | Despesa — valida description, amount (> 0), category e expenseDate |
| `PaymentFactory.ts` | Pagamento — valida residentId, amount (> 0) e formato do month (YYYY-MM) |

### `src/repositories/`

Cada repository encapsula todas as operações de banco de uma entidade. Usam o `DatabaseConnection.getInstance()` para obter a conexão ativa.

| Arquivo | Coleção MongoDB | Operações principais |
|---------|----------------|---------------------|
| `ResidentRepository.ts` | `residents` | `findAll` (paginado), `findById`, `save`, `update`, `delete` (soft-delete via `isActive: false`) |
| `ExpenseRepository.ts` | `expenses` | `findAll` (paginado + filtros dinâmicos), `findById`, `save`, `update`, `delete` |
| `PaymentRepository.ts` | `payments` | `findByMonth`, `findByResidentAndMonth`, `save`, `delete`, `sumByResidentAndMonth` |
| `MonthlyBalanceRepository.ts` | `monthlyBalances` | `findByMonth`, `findByResidentAndMonth`, `upsert` (cria ou atualiza) |
| `IRepository.ts` | — | Interface genérica com contrato: `findAll`, `findById`, `save`, `update`, `delete` |

### `src/modules/`

Cada módulo contém as rotas HTTP de um domínio. As rotas são registradas no `routes.ts` central.

| Módulo | Prefixo | Endpoints |
|--------|---------|-----------|
| `residents/` | `/api/residents` | `GET /` (paginado), `POST /`, `PUT /:id`, `DELETE /:id` |
| `expenses/` | `/api/expenses` | `GET /` (filtros: category, isExtra, minAmount, maxAmount, search, startDate, endDate), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `categories/` | `/api/categories` | `GET /` (retorna enum ExpenseCategory), `POST /`, `DELETE /:id` |
| `budgets/` | `/api/budgets` | `GET /:republicaId/:year/:month`, `POST /` |
| `payments/` | `/api/payments` | `GET /` (filtros: month, residentId), `POST /`, `DELETE /:id` |
| `monthly-balance/` | `/api/monthly-balance` | `GET /` (calcula saldos do mês), `GET /:residentId` (saldo individual), `POST /:residentId/payment` (registra pagamento e recalcula) |
| `reports/` | `/api/reports` | `GET /monthly` (relatório consolidado: despesas + saldos + adimplência) |

### `src/modules/monthly-balance/monthlyBalance.utils.ts`

Funções puras de cálculo financeiro, sem dependência de banco:

- `calculateMonthlyShare(expenses, activeResidentCount)` — divide o total de despesas **comuns** (não extras) pelo número de moradores ativos
- `calculateCurrentBalance(previousBalance, monthlyShare, amountPaid)` — calcula o saldo atual: `anterior + cota - pago`
- `toMonthKey(year, month)` — formata `2026, 6` em `'2026-06'`

### `src/shared/`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `middlewares/asyncHandler.ts` | Wrapper para rotas async — captura exceções e passa para o handler de erro do Express via `next(error)`, evitando try/catch em cada rota |

---

## Padrões Utilizados

**Singleton** — `DatabaseConnection` garante uma única conexão com o MongoDB durante toda a execução.

**Factory** — cada entidade tem sua factory que centraliza validação e criação, evitando código duplicado nas rotas.

**Repository** — isola o acesso ao banco de dados das rotas. As rotas não conhecem detalhes do MongoDB.

**Soft Delete** — moradores não são removidos fisicamente. O campo `isActive` é marcado como `false`, preservando o histórico financeiro vinculado ao `residentId`.

---

## Variáveis de Ambiente

Definidas no `.env` (baseado em `.env.example`):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONGODB_URI` | String de conexão com o MongoDB | `mongodb://admin:password@localhost:27017/caixinha?authSource=admin` |
| `PORT` | Porta do servidor backend | `3001` |

---

Tecnologia: **Vitest** (já configurado em `vitest.config.ts`).