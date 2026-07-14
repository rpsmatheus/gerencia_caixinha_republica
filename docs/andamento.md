# Andamento do Projeto — Caixinha App

> Última atualização: Junho de 2026  


---

## Visão Geral

O Caixinha App é um sistema web para gestão financeira de repúblicas estudantis, desenvolvido com arquitetura REST API + SPA. O backend em Node.js + Express + TypeScript expõe uma API que persiste dados em MongoDB. O frontend em React + Vite consome essa API. Toda a infraestrutura é containerizada com Docker Compose.

O desenvolvimento segue um planejamento de 10 sprints semanais. Esta página documenta o estado atual de cada módulo.

---

## Módulos Implementados

### Infraestrutura e Configuração

Ambiente completamente containerizado com Docker Compose, orquestrando três serviços: backend (porta 3001), frontend (porta 5173) e MongoDB (porta 27017). O backend usa TypeScript com compilação via `tsc` e modo de desenvolvimento com `tsx watch`. Conexão com MongoDB implementada com o padrão Singleton, garantindo uma única instância de conexão durante o ciclo de vida da aplicação.

### Módulo de Moradores — `GET/POST/PUT/DELETE /api/residents`

CRUD completo de moradores. Cada morador possui nickname (único), nome completo, WhatsApp e status ativo/inativo. A exclusão é implementada como **soft delete** — o campo `isActive` é marcado como `false` em vez de remover o registro, preservando o histórico financeiro vinculado ao morador.

### Módulo de Despesas — `GET/POST/PUT/DELETE /api/expenses`

Registro e consulta de despesas com suporte a filtros dinâmicos via query string: categoria, flag `isExtra`, valor mínimo/máximo, busca por descrição e intervalo de datas. Despesas são classificadas como **comuns** (incluídas na divisão entre moradores) ou **extras** (individuais, não entram no cálculo da cota). Resultados paginados.

Categorias disponíveis via enum `ExpenseCategory`: Moradia, Alimentação, Transporte, Utilidades, Limpeza, Internet, Pets e Outros.

### Módulo de Categorias — `GET /api/categories`

Endpoint que retorna as categorias de despesas disponíveis no sistema, derivadas do enum `ExpenseCategory`.

### Módulo de Orçamentos — `GET/POST /api/budgets`

Definição de limites de gastos por categoria e mês (`month` no formato `YYYY-MM`). Permite planejar o orçamento antes do fechamento mensal.

### Módulo de Pagamentos — `GET/POST/DELETE /api/payments`

Registro de pagamentos com `residentId`, `month` (formato `YYYY-MM`) e `amount`. Suporta filtragem por mês e por morador. O `PaymentRepository` expõe um método `sumByResidentAndMonth` utilizado pelo módulo de fechamento para calcular o total pago por cada morador.

### Módulo de Fechamento Mensal — `/api/monthly-balance`

Módulo central do sistema. Três endpoints:

- `GET /api/monthly-balance?year=&month=` — calcula e persiste o saldo de todos os moradores ativos no mês. O cálculo divide o total das despesas **comuns** pelo número de moradores ativos (`monthlyShare`), soma ao saldo do mês anterior (`previousBalance`) e subtrai os pagamentos já realizados (`amountPaid`). O resultado é o `currentBalance`.
- `GET /api/monthly-balance/:residentId?year=&month=` — retorna o saldo calculado de um morador específico.
- `POST /api/monthly-balance/:residentId/payment` — registra um pagamento diretamente pelo fechamento e recalcula o `currentBalance` automaticamente.

A fórmula de cálculo: `currentBalance = previousBalance + monthlyShare - amountPaid`

### Módulo de Relatórios — `GET /api/reports/monthly`

Relatório consolidado por mês contendo: total de despesas (separado em comuns e extras), despesas agrupadas por categoria, total arrecadado, total pendente, contagem de moradores adimplentes e inadimplentes, e taxa de adimplência em percentual.

---

## O que ainda falta implementar

### Interface visual (Frontend)

Nenhuma tela funcional foi desenvolvida ainda. O `main.tsx` está com a estrutura inicial e o React Router não está configurado. As telas previstas são: dashboard mensal, despesas, moradores, orçamentos e relatórios. Esta é a maior parte do trabalho restante.

### Autenticação (Sprint 5)

Login com nickname e senha usando tokens JWT (biblioteca `jose` já está nas dependências). Inclui geração e validação de tokens, middleware `authenticateJwt` para proteção de rotas e endpoint de troca de senha.

### Controle de Acesso — RBAC (Sprint 6)

Definição de papéis `admin` e `resident` com middlewares de autorização (`requireAdmin`, `requireRole`). Rotas de escrita (POST, PUT, DELETE) serão restritas ao administrador.

### Categorização de Moradores (Sprint 6)

Suporte a categorias como Morador, Bixo e Agregado no model `IResident`, com possíveis diferenças de cálculo ou permissão entre elas.

### Cálculo Proporcional

Ajuste da cota mensal para moradores que entraram ou saíram no meio do mês, aplicando um fator proporcional ao número de dias de permanência.

### Seed de dados

Script `src/database/seed.ts` (referenciado no `package.json` como `pnpm db:seed`) para popular o banco com dados iniciais de teste.

---

## Progresso por Sprint

| Sprint | Tema | Status |
|--------|------|--------|
| Configuração | Ambiente, Docker, banco de dados, models | ✅ Concluído |
| Sprint 1 | Módulo de Despesas (CRUD + filtros) | ✅ Concluído |
| Sprint 2 | Categorias e Orçamentos | ✅ Concluído |
| Sprint 3 | Pagamentos e Fechamento Mensal (Parte 1) | ✅ Concluído |
| Sprint 4 | Fechamento Mensal (Parte 2) e Relatórios | ✅ Concluído |
| Sprint 5 | Autenticação JWT | ⏳ Pendente |
| Sprint 6 | Moradores (categorias) e RBAC | ⏳ Pendente |
| Sprints 7–9 | Interface visual (React) | ⏳ Pendente |
| Sprint 10 | Testes, refinamentos e entrega | 🔄 Em andamento — 127 testes no backend + 28 no frontend, CI no GitHub Actions (ver [docs/testes.md](testes.md)) |
