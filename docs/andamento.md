# Andamento do Projeto — Caixinha App

## O que já foi implementado

### Infraestrutura e configuração
- Repositório configurado com branches e proteção de `main`
- Docker Compose orquestrando backend, frontend e MongoDB
- `.env.example` com todas as variáveis necessárias
- `run.sh` para inicialização simplificada
- TypeScript configurado no backend com `tsconfig.json` e Vitest para testes

### Backend

#### Conexão com banco de dados
- `DatabaseConnection` com padrão Singleton para MongoDB
- Suporte a conexão via variável de ambiente `MONGODB_URI`

#### Models (interfaces de domínio)
- `IResident` com campos: nickname, fullName, whatsappNumber, isActive, joinDate, createdAt, updatedAt
- `IExpense` com enum `ExpenseCategory` (Moradia, Alimentação, Transporte, Utilidades, Limpeza, Internet, Pets, Outros), filtros e DTOs
- `IPayment` com residentId, month (YYYY-MM), amount, proofUrl
- `IMonthlyBalance` com previousBalance, monthlyShare, totalDue, amountPaid, currentBalance e interfaces de relatório
- `IBudget` com republicaId, description, amount, category, month, isApplied

#### Factories
- `ResidentFactory` — valida nickname e fullName, converte nickname para minúsculas
- `ExpenseFactory` — valida todos os campos obrigatórios, gera UUID, define isExtra como false por padrão
- `PaymentFactory` — valida residentId, amount e formato de month (YYYY-MM)

#### Repositories
- `ResidentRepository` — CRUD com soft-delete (isActive: false)
- `ExpenseRepository` — busca paginada com filtros dinâmicos (categoria, isExtra, valor mínimo/máximo, busca por descrição, intervalo de datas)
- `PaymentRepository` — busca por mês e por morador+mês, soma de pagamentos
- `MonthlyBalanceRepository` — upsert (cria ou atualiza saldo do mês por morador)

#### Módulos (rotas HTTP)
- `GET/POST /api/residents` + `PUT/DELETE /api/residents/:id`
- `GET/POST/PUT/DELETE /api/expenses` com filtros completos
- `GET /api/categories` retorna enum de categorias disponíveis
- `GET/POST /api/budgets`
- `GET/POST/DELETE /api/payments` com filtro por mês e morador
- `GET /api/monthly-balance` — calcula saldos do mês para todos os moradores ativos
- `GET /api/monthly-balance/:residentId` — saldo individual
- `POST /api/monthly-balance/:residentId/payment` — registra pagamento e recalcula saldo
- `GET /api/reports/monthly` — relatório consolidado com despesas, saldos e taxa de adimplência

#### Utilitários
- `asyncHandler` — captura erros em rotas async e passa para o Express
- `calculateMonthlyShare` — divide despesas comuns entre moradores ativos
- `calculateCurrentBalance` — calcula saldo: anterior + cota - pago
- `toMonthKey` — formata year/month para string YYYY-MM

### Frontend
- Projeto React + Vite + Tailwind CSS configurado e rodando na porta 5173
- Estrutura de pastas criada

---

## O que ainda falta implementar

### Frontend (maior parte do trabalho restante)
- Nenhuma tela funcional está implementada — o `main.tsx` ainda está com estrutura inicial
- Telas a criar: Despesas, Moradores, Categorias, Orçamentos, Dashboard Mensal, Relatórios
- Serviço de API (`api.ts`) para comunicação com o backend
- Componentes reutilizáveis (cards, formulários, notificações, layout)

### Backend
- **Autenticação** (Sprint 5 do planejamento) — login/logout
- **Controle de acesso por papel** (RBAC — Sprint 6) — roles admin e morador, middleware `requireAdmin`
- **Módulo de Moradores completo** (Sprint 6) — categorização (Bixo, Agregado, Morador), status mensal proporcional
- **Cálculo proporcional** — fator de permanência para moradores que ficaram parte do mês
- **Seed de dados** — popular o banco com moradores e despesas de exemplo para testes

### Infra / qualidade
- Testes unitários e de integração

---

## Histórico de sprints

| Sprint | Status | O que foi feito |
|--------|--------|----------------|
| Config + Banco | ✅ Concluído | Alejandro configurou ambiente completo; Luiz Miguel implementou MongoDB Singleton e models |
| Sprint 1 — Despesas | ✅ Concluído | CRUD completo de despesas com filtros (PR #43, #45) |
| Sprint 2 — Categorias e Orçamentos | ✅ Parcial | Categorias retornam enum; orçamentos têm GET e POST básicos |
| Sprint 3 — Pagamentos | ✅ Concluído | Módulo de pagamentos completo (PR #47, #48) |
| Sprint 3 — Fechamento Mensal pt.1 | ✅ Concluído | Cálculo de saldos mensais (PR #49) |
| Sprint 4 — Fechamento Mensal pt.2 | ✅ Concluído | Saldo individual e pagamento via fechamento (PR #50) |
| Sprint 4 — Relatórios | ✅ Concluído | Relatório mensal consolidado (PR #51) |
| Sprint 5 — Autenticação | ⏳ Pendente | — |
| Sprint 6 — Moradores e RBAC | ⏳ Pendente | — |
| Sprints 7–9 — Frontend | ⏳ Pendente | — |
| Sprint 10 — Testes e deploy | ⏳ Pendente | — |

---