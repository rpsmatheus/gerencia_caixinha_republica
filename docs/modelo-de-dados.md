# Modelo de Dados e Regras de Negócio

> Última atualização: Julho de 2026

Este documento descreve as entidades do domínio (coleções MongoDB) e as regras de cálculo da caixinha. Para os contratos de request/response da API, ver [docs/api.md](api.md).

---

## Entidades

### Resident (`residents`)

Representa tanto o admin de uma república quanto seus moradores — diferenciados pelo campo `role`.

| Campo | Tipo | Observações |
|-------|------|-------------|
| `_id` | ObjectId | |
| `nickname` | string | Único (índice), sempre salvo em minúsculas |
| `fullName` | string | |
| `whatsappNumber` | string? | Opcional |
| `category` | `'Bixo' \| 'Agregado' \| 'Morador'` | Padrão `'Bixo'` se não informada/inválida no cadastro. Só `admin` altera depois de criado |
| `role` | `'admin' \| 'resident'` | Definido na criação, não é editável depois |
| `passwordHash` | string | argon2 |
| `mustChangePassword` | boolean | `true` quando a senha foi gerada automaticamente |
| `republicId` | string | Isolamento multi-tenant — todo filtro de listagem usa esse campo |
| `isActive` | boolean | Sempre `true` hoje — não há fluxo que desative um morador globalmente |
| `joinDate`, `createdAt`, `updatedAt` | Date | |

**Regras:**
- Nickname único **por todo o banco**, não só por república (o índice não é composto com `republicId`).
- Não existe exclusão nem desativação — ver [docs/decisoes-tecnicas.md](decisoes-tecnicas.md).
- `role: 'admin'` é criado apenas via `POST /auth/register`; `POST /residents` sempre cria `role: 'resident'`.

### Expense (`expenses`)

| Campo | Tipo | Observações |
|-------|------|-------------|
| `_id` | ObjectId | |
| `userId` | string | Quem criou a despesa |
| `republicId` | string | Isolamento multi-tenant |
| `description` | string | Obrigatório, trim |
| `category` | string | Um dos valores de `ExpenseCategory` ou uma categoria customizada (ver `Category`) |
| `amount` | number | > 0 |
| `expenseDate` | Date | |
| `proofUrl` | string? | URL externa do comprovante (Drive/S3/imagem/PDF), informada no cadastro/edição da despesa |
| `notes` | string? | |
| `createdAt`, `updatedAt` | Date | |

`ExpenseCategory` (enum fixo, sempre disponível): `Moradia`, `Alimentação`, `Transporte`, `Utilidades`, `Limpeza`, `Internet`, `Pets`, `Outros`. Não há campo `isExtra` no modelo atual — a distinção comum/extra citada em versões anteriores da documentação não existe mais no código; toda despesa listada entra igualmente no cálculo da cota mensal.

### Category (`categories`)

Categorias de despesa **customizadas por república**, adicionais ao enum fixo de `ExpenseCategory`.

| Campo | Tipo |
|-------|------|
| `id` | string (UUID) |
| `name` | string — único por `republicId` |
| `republicId` | string |
| `createdAt` | Date |

### Payment (`payments`)

| Campo | Tipo | Observações |
|-------|------|-------------|
| `id` | string (UUID) | |
| `residentId` | string | |
| `month` | string | Formato `YYYY-MM` |
| `amount` | number | > 0 |
| `proofUrl` | string? | |
| `notes` | string? | |
| `createdAt` | Date | |

Não tem `republicId` — a rota `/api/payments` não filtra por república (é a mesma rota que está sem `authMiddleware`, ver gap em [docs/autenticacao-e-autorizacao.md](autenticacao-e-autorizacao.md)).

### MonthlyBalance (`monthlyBalances`)

Um documento por `(residentId, year, month)` — recalculado e sobrescrito (`upsert`) toda vez que `GET /monthly-balance/:year/:month` é chamado.

| Campo | Tipo | Observações |
|-------|------|-------------|
| `id` | string | |
| `residentId` | string | |
| `year`, `month` | number | |
| `previousBalance` | number | Igual ao `currentBalance` do documento do mês anterior (ou 0) |
| `monthlyShare` | number | Cota deste morador neste mês (já com o fator proporcional aplicado) |
| `totalDue` | number | `previousBalance + monthlyShare` |
| `amountPaid` | number | Soma dos pagamentos do morador no mês |
| `currentBalance` | number | `totalDue - amountPaid` — positivo = devendo, negativo/zero = quitado |
| `isActive` | boolean? | Ativo **neste mês específico** — independe do `isActive` global do `Resident` |
| `exitDay` | number \| null | Dia de saída no mês, para cálculo proporcional |
| `proportionalFactor` | number | Entre 0 e 1 |

### Budget (`budgets`) e BudgetTemplate (`budgetTemplates`)

`BudgetTemplate` é um modelo reutilizável (`description`, `category`, `amount`) que o admin configura uma vez. `Budget` é a instância desse gasto planejado para um `year`/`month` específico — criada manualmente ou em lote via `POST /budgets/simulate/:year/:month` a partir dos templates. Quando "aplicado" (`POST /budgets/:id/apply`), um `Budget` vira uma `Expense` real e marca `isApplied: true` + `appliedExpenseId`.

Ambos têm `republicId` e são isolados por república.

---

## Relacionamentos

```
Resident (role: admin) ──1:N──▶ Resident (role: resident)      [mesmo republicId]
Resident ──1:N──▶ Expense            (via republicId, não FK direta)
Resident ──1:N──▶ Payment            (via residentId)
Resident ──1:N──▶ MonthlyBalance     (via residentId, um doc por mês)
BudgetTemplate ──1:N──▶ Budget       (instanciado por mês via /simulate)
Budget ──0:1──▶ Expense              (quando aplicado, via appliedExpenseId)
```

Não há chaves estrangeiras reais (MongoDB) — a integridade é mantida na camada de aplicação (repositories/rotas), não no banco.

---

## Regra de negócio: cálculo da cota mensal

Implementada em `backend/src/modules/monthly-balance/monthlyBalance.utils.ts`, aplicada em `monthlyBalance.routes.ts`.

### 1. Fator proporcional (`computeProportionalFactor`)

```
proportionalFactor = exitDay == null || exitDay <= 0
  ? 1
  : min(exitDay, totalDaysInMonth) / totalDaysInMonth
```

Um morador que ficou o mês inteiro tem fator `1`. Um morador que saiu no dia 10 de um mês de 30 dias tem fator `10/30 ≈ 0,333`.

### 2. Cota por peso proporcional (`calculateMonthlyShare`)

```
totalProportionalWeight = soma do proportionalFactor de todos os moradores ativos no mês
monthlyShare = totalExpenses / totalProportionalWeight
```

**Importante:** a divisão não é pelo número de moradores ativos (contagem de cabeças) — é pela **soma dos fatores proporcionais**. Isso garante que a soma de todas as cotas pagas sempre feche exatamente com o total de despesas do mês, mesmo com entradas/saídas no meio do mês: quem saiu paga menos, e a diferença é redistribuída proporcionalmente entre os demais ativos (não é uma "perda" absorvida pela república).

### 3. Saldo final por morador

```
currentMonthDue   = isActive ? monthlyShare × proportionalFactor : 0
totalDue          = previousBalance + currentMonthDue
remainingBalance  = totalDue − totalPaid
```

`previousBalance` é sempre o `currentBalance` já persistido do mês anterior — o sistema não tem um "reset" de dívida entre meses; saldo negativo (crédito) também é arrastado.

### 4. Ativação/inativação por mês

`isActive` em `MonthlyBalance` é independente do `isActive` do `Resident`. Um morador pode estar "ativo" no cadastro global mas inativo em um mês específico (`PUT /monthly-balance/:year/:month/:residentId/status`) — por exemplo, alguém que viajou o mês inteiro e não deve entrar na divisão daquele mês, mas continua morador.
