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

## Próximas fases (ainda não implementadas)

### Fase 2 — Backend: testes de integração de rotas

- Adicionar `supertest` como devDependency.
- Mockar os repositories injetados via `appContext` em vez de subir MongoDB real.
- Cobrir por módulo: happy path + erro de validação + 401/403 (`authMiddleware`/`authorize`) para `residents`, `expenses`, `payments`, `monthly-balance`, `reports`, `budgets`, `categories`, `auth`.

### Fase 3 — Frontend: infraestrutura de teste

- Adicionar Vitest + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` + `jsdom` (nenhuma dessas dependências existe hoje no `frontend/package.json`).
- Testar primeiro lógica isolada: `usePermissions` (matriz admin vs. resident vs. deslogado) e `AuthContext`.
- Depois, componentes de apresentação simples (`Button`, `ActionButton`, `Notification`, `ResidentCard`, `ResidentBalanceCard`).
- Mockar `services/api.ts` (via `vi.mock`) para testar páginas críticas (`Residents`, `Expenses`, `MonthlyDashboard`) sem depender do backend real.

### Fase 4 — Métricas de qualidade e CI

- Limiar de cobertura inicial (ex.: 60–70% em linhas/branches) nos dois lados, subindo com o tempo.
- Workflow `.github/workflows/ci.yml`: `lint` + `tsc --noEmit` + `test` + `test:coverage` para backend e frontend em push/PR.
- Opcional: Codecov/SonarCloud para acompanhar tendência de cobertura, `pnpm audit` para dependências vulneráveis.
