# Métricas de Qualidade — Testes Automatizados

> Início: Julho de 2026

Este documento registra a estratégia de testes automatizados adotada no projeto, o que já está implementado e o que falta para as próximas fases.

---

## Por que

Antes desta iniciativa, o backend tinha o Vitest configurado (`vitest.config.ts`, scripts `test`/`test:coverage`) mas nenhum teste real existia (`backend/tests/` não existia). O frontend não tinha nenhuma ferramenta de teste instalada. Não havia CI rodando lint/test em PRs.

O objetivo é ter métricas de qualidade de verdade — cobertura de teste unitário, execução automática — para os dois lados da aplicação, priorizando primeiro o que já é lógica pura e mais barato de testar.

## Estratégia (4 fases)

1. **Backend — testes unitários puros** (implementado nesta branch): funções de cálculo, factories e assinatura/verificação de JWT. Não dependem de banco nem de mocks complexos.
2. **Backend — testes de integração de rotas**: rotas HTTP com `supertest`, repositories mockados (sem subir MongoDB real).
3. **Frontend — infraestrutura de teste**: Vitest + React Testing Library, começando por hooks/contextos (`usePermissions`, `AuthContext`) e componentes de apresentação.
4. **CI**: workflow no GitHub Actions rodando lint + typecheck + testes + cobertura em push/PR.

---

## Fase 1 — Backend: testes unitários puros ✅

### O que foi coberto

| Arquivo de teste | Alvo | O que valida |
|---|---|---|
| `tests/utils/monthlyBalance.utils.test.ts` | `src/modules/monthly-balance/monthlyBalance.utils.ts` | `calculateMonthlyShare` (divisão pelo peso proporcional total, casos de peso zero/negativo), `computeProportionalFactor` (saída no meio do mês, `exitDay` nulo/negativo, clamp em 1), `toMonthKey`, `daysInMonth` (incluindo ano bissexto) |
| `tests/factories/ExpenseFactory.test.ts` | `src/factories/ExpenseFactory.ts` | criação válida, trim de `description`/`notes`, validação de `description`/`amount`/`category`/`expenseDate` obrigatórios e `amount > 0` |
| `tests/factories/PaymentFactory.test.ts` | `src/factories/PaymentFactory.ts` | criação válida, geração de `id` único, validação de `residentId`, `amount > 0` e formato `YYYY-MM` de `month` |
| `tests/factories/ResidentFactory.test.ts` | `src/factories/ResidentFactory.ts` | criação válida, lowercase do `nickname`, hash argon2 real da senha (verificado com `argon2.verify`), categoria padrão (`Bixo`) quando inválida, `role` default `resident`, validação dos campos obrigatórios |
| `tests/shared/jwt.test.ts` | `src/shared/jwt.ts` | `signAccessToken`/`verifyAccessToken` preservam o payload, formato JWT válido, rejeição de token corrompido/inválido |

**Resultado:** 46 testes, 5 arquivos, 100% de cobertura em `factories/` e `monthlyBalance.utils.ts`, 94% em `jwt.ts` (a linha não coberta é o `throw` de `JWT_SECRET` ausente, que não deve ser exercitado em teste).

### Mudanças de configuração

- `backend/vitest.config.ts`: adicionado `setupFiles: ['./tests/setup.ts']` (garante `JWT_SECRET`/`JWT_EXPIRES_IN` no ambiente de teste) e bloco `coverage` com provider `v8`.
- `backend/package.json`: `@vitest/coverage-v8` adicionado como devDependency (necessário para `pnpm test:coverage`).
- `.gitignore`: adicionada entrada `coverage/` (pasta gerada pelo relatório de cobertura, não deve ser versionada).

### Como rodar

```bash
cd backend
pnpm install
pnpm test              # roda a suíte uma vez (ou em watch, se chamado sem --run)
pnpm test:coverage     # roda com relatório de cobertura (texto + html + lcov)
```

---

## Fase 2 — Backend: testes de integração de rotas ✅

### Estratégia de mock

As rotas nunca recebem os repositories por injeção de dependência — cada módulo importa a classe diretamente (`new ResidentRepository()`) ou usa a instância singleton exportada por `app/appContext.ts`. Os testes de integração mockam a **classe** do repository com `vi.mock(...)`, usando `vi.hoisted()` para compartilhar o mesmo objeto mock entre todas as instanciações (`new XRepository()` sempre retorna a mesma referência). Isso funciona igual nos dois padrões de uso do projeto, sem precisar alterar o código de produção.

Para rotas protegidas, `authMiddleware` também é mockado: em vez de verificar um JWT real e consultar o Mongo, o middleware de teste lê um header `x-test-user` (JSON com `id`/`role`/`republicId`) e popula `req.user` diretamente. O middleware `authorize` (RBAC) **não é mockado** — roda de verdade, então os testes continuam cobrindo os casos de 403 por papel incorreto. A revalidação de token/usuário em si já está coberta pelos testes unitários de `jwt.ts` (Fase 1); repetir isso em cada rota seria redundante.

`ExpenseFactory`, `PaymentFactory` e o cálculo de `monthlyBalance.utils` rodam **de verdade** dentro das rotas (não são mockados) — o Vitest resolve o módulo real, então a integração também serve como teste de regressão da lógica de negócio já coberta na Fase 1.

### O que foi coberto

| Arquivo de teste | Módulo | Destaques |
|---|---|---|
| `tests/modules/auth.routes.test.ts` | `auth` | registro (senha curta, nickname duplicado), login (senha errada com argon2 real, usuário inexistente), `/me` e `/change-password` autenticados via `DatabaseConnection` mockada |
| `tests/modules/residents.routes.test.ts` | `residents` | RBAC (`POST` só admin), um morador só edita a si mesmo, admin pode mudar categoria e outros não, conflito de nickname (409) |
| `tests/modules/expenses.routes.test.ts` | `expenses` | paginação, filtros repassados ao repository, 404 em `GET`/`PUT` por id, **erro de validação da factory não vira 400** (ver "Gaps encontrados" abaixo) |
| `tests/modules/payments.routes.test.ts` | `payments` | sem autenticação (rota pública — ver gaps), filtro por `residentId`, validação de `month` |
| `tests/modules/categories.routes.test.ts` | `categories` | RBAC, nome duplicado (409, case-insensitive na regra real) |
| `tests/modules/reports.routes.test.ts` | `reports` | agregação de despesas por categoria, taxa de adimplência, caso sem moradores ativos |
| `tests/modules/monthlyBalance.routes.test.ts` | `monthly-balance` | divisão igualitária, **redistribuição da cota de quem está inativo no mês**, saldo anterior + pagamentos no cálculo do saldo restante, status/proporcional/pagamento |
| `tests/modules/budgets.routes.test.ts` | `budgets` | modelos (templates), simulação idempotente por descrição, aplicar orçamento como despesa real (404/409), atualizar e remover |

**Resultado:** 81 testes de integração + 46 unitários = **127 testes**, 13 arquivos. Módulos de rota entre 94% e 100% de cobertura (o que falta é código dentro dos mocks — `authMiddleware.ts`, `database.ts`, corpo interno dos repositories — que não deve mesmo ser exercitado aqui).

### Gaps reais encontrados durante os testes (não corrigidos, fora do escopo desta tarefa)

- **`POST /api/payments` não tem `authMiddleware`** — a rota é pública, diferente de todos os outros módulos de escrita. Mesmo padrão em `GET`/`DELETE /api/payments`.
- **`GET /api/reports/monthly` também não tem `authMiddleware`** — qualquer um pode ler o relatório consolidado do mês sem estar autenticado.
- **Não há middleware de erro global** em `createApp.ts`. Erros de validação lançados pelas factories (`ExpenseFactory`, `PaymentFactory`) dentro de uma rota não viram `400` — chegam ao handler de erro padrão do Express e retornam `500`. Os testes documentam esse comportamento (`propaga o erro de validação da factory`), mas o ideal seria um middleware de erro que traduzisse exceções conhecidas em respostas 400.

### Como rodar

```bash
cd backend
pnpm test                          # todos os 127 testes
pnpm test tests/modules/            # só os testes de integração de rotas
pnpm test:coverage
```

## Próximas fases (ainda não implementadas)

### Fase 3 — Frontend: infraestrutura de teste

- Adicionar Vitest + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` + `jsdom` (nenhuma dessas dependências existe hoje no `frontend/package.json`).
- Testar primeiro lógica isolada: `usePermissions` (matriz admin vs. resident vs. deslogado) e `AuthContext`.
- Depois, componentes de apresentação simples (`Button`, `ActionButton`, `Notification`, `ResidentCard`, `ResidentBalanceCard`).
- Mockar `services/api.ts` (via `vi.mock`) para testar páginas críticas (`Residents`, `Expenses`, `MonthlyDashboard`) sem depender do backend real.

### Fase 4 — Métricas de qualidade e CI

- Limiar de cobertura inicial (ex.: 60–70% em linhas/branches) nos dois lados, subindo com o tempo.
- Workflow `.github/workflows/ci.yml`: `lint` + `tsc --noEmit` + `test` + `test:coverage` para backend e frontend em push/PR.
- Opcional: Codecov/SonarCloud para acompanhar tendência de cobertura, `pnpm audit` para dependências vulneráveis.
