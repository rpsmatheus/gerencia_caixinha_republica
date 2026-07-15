# Referência da API — Caixinha App

> Última atualização: Julho de 2026

Base URL: `http://localhost:3001/api`

Todas as respostas de sucesso seguem `{ success: true, data: ... }` (às vezes com `total`/`pagination`). Erros seguem `{ error: "mensagem" }` (alguns módulos usam `{ success: false, error: "..." }`).

🔒 = exige header `Authorization: Bearer <accessToken>`. Papel entre colchetes = exige esse RBAC via `authorize(...)` (ver [docs/autenticacao-e-autorizacao.md](autenticacao-e-autorizacao.md)). Sem marcação = rota pública.

---

## Auth — `/api/auth`

### `POST /auth/register`
Cria uma conta **admin** nova, dona de uma república nova (`republicId` gerado). Quem se registra não é um morador — não aparece em `/residents` nem entra na divisão da caixinha.

Body: `{ nickname, password }` (`password` mínimo 6 caracteres).
- `201` → `{ success: true, data: { accessToken, resident } }`
- `400` — nickname/senha ausente ou senha curta
- `409` — nickname já em uso

### `POST /auth/login`
Body: `{ identifier, password }` (`identifier` = nickname).
- `200` → `{ success: true, data: { accessToken, resident } }`
- `400` — campos ausentes
- `401` — credenciais inválidas

### `POST /auth/logout`
Sem efeito no servidor (stateless) — só padroniza a resposta para o frontend limpar a sessão local. `200` → `{ success: true }`.

### `GET /auth/me` 🔒
Retorna o usuário autenticado (revalidado contra o banco). `200` → `{ success: true, data: { resident } }`. `401` se o usuário não existir mais.

### `POST /auth/change-password` 🔒
Body: `{ currentPassword, newPassword }`.
- `200` → `{ success: true }`, limpa `mustChangePassword`
- `401` — senha atual incorreta

**Formato de `resident` retornado por essas rotas:** `{ id, nickname, fullName, phone, role, isActive, mustChangePassword }`.

---

## Residents — `/api/residents`

### `GET /residents` 🔒 `[admin, resident]`
Query: `page`, `limit` (padrão 1/10), `search` (busca parcial por `fullName` ou `nickname`). Lista só moradores (`role: 'resident'`) da república do usuário — o admin nunca aparece na lista.
`200` → `{ success: true, data: Resident[], total }`.

### `POST /residents` 🔒 `[admin]`
Body: `{ nickname, fullName, whatsappNumber?, category?, password? }`. Se `password` não for informada, uma senha temporária de 12 caracteres é gerada (`mustChangePassword: true`).
- `201` → `{ success: true, data: Resident, generatedPassword? }` (`generatedPassword` só vem quando o admin não informou senha própria)
- `409` — nickname já em uso

### `PUT /residents/:id` 🔒
O próprio morador só edita a si mesmo; admin edita qualquer um. Body aceita `fullName`, `nickname`, `phone`, e `category` (só admin pode alterar `category`).
- `200` → `{ success: true, data: Resident }`
- `403` — morador tentando editar outro id
- `409` — nickname já em uso

**Não existe `DELETE /residents/:id`.** Ver [docs/decisoes-tecnicas.md](decisoes-tecnicas.md) sobre por quê.

**Formato de `Resident`:** `{ id, fullName, nickname, phone, category, isActive, role, createdAt }`.

---

## Expenses — `/api/expenses`

Todas exigem 🔒 `[admin, resident]`.

### `GET /expenses`
Query: `page`, `limit`, `category`, `minAmount`, `maxAmount`, `search` (parcial em `description`), `startDate`, `endDate`.
`200` → `{ success: true, data: Expense[], pagination: { page, limit, total, pages } }`.

### `GET /expenses/:id`
`200` → `{ success: true, data: Expense }` · `404` se não encontrado.

### `POST /expenses`
Body: `{ description, category, amount, expenseDate, notes? }`.
`201` → `{ success: true, data: Expense }`.
> Erros de validação da factory (`description`/`amount`/`category`/`expenseDate` ausentes, `amount <= 0`) **não viram 400** hoje — chegam ao handler padrão do Express e retornam `500` (gap documentado em [docs/andamento.md](andamento.md)).

### `PUT /expenses/:id`
Body: qualquer subconjunto de `{ description, category, amount, expenseDate, notes }`.
`200` → `{ success: true, data: Expense }` · `404` se não encontrado.

### `DELETE /expenses/:id`
`200` → `{ success: true, message: "Despesa removida com sucesso" }`.

### `POST /expenses/:id/proof`
Envia (ou substitui) o comprovante da despesa. Body `multipart/form-data` com um único campo `file`, aceitando `application/pdf` ou qualquer `image/*` (limite de 10MB). Se já existir um comprovante, o arquivo antigo é apagado do disco.
`200` → `{ success: true, data: Expense }` · `400` se o arquivo não for PDF/imagem ou estiver ausente · `404` se a despesa não existir (ou for de outra república).

### `GET /expenses/:id/proof`
Baixa o arquivo do comprovante da despesa (mesmas permissões das demais rotas de despesa — qualquer morador/admin da mesma república).
`200` → arquivo do comprovante (`Content-Disposition: attachment`) · `404` se a despesa ou o comprovante não existir.

### `DELETE /expenses/:id/proof`
Remove o comprovante da despesa (apaga o arquivo do disco e limpa os metadados).
`200` → `{ success: true, data: Expense }` · `404` se não houver comprovante.

**Formato de `Expense`:** `{ id, description, category, amount, expenseDate (YYYY-MM-DD), notes, hasProof, proofOriginalName, createdAt, updatedAt }`. `hasProof` indica se existe um arquivo de comprovante salvo no servidor; `proofOriginalName` é o nome original do arquivo enviado (para exibição). O comprovante em si é obtido via `GET /expenses/:id/proof`, não vem embutido na resposta. Categorias válidas: `Moradia`, `Alimentação`, `Transporte`, `Utilidades`, `Limpeza`, `Internet`, `Pets`, `Outros`.

---

## Categories — `/api/categories`

### `GET /categories` 🔒 `[admin, resident]`
Lista as categorias customizadas da república. `200` → `{ success: true, data: Category[] }`.

### `POST /categories` 🔒 `[admin]`
Body: `{ name }`.
- `201` → `{ success: true, data: Category }`
- `400` — `name` ausente
- `409` — nome já existe na república

### `DELETE /categories/:id` 🔒 `[admin]`
`200` → `{ success: true, message: "Categoria removida com sucesso" }`.

**Formato de `Category`:** `{ id, name, republicId, createdAt }`.

---

## Budgets — `/api/budgets`

### `GET /budgets/templates` 🔒 `[admin, resident]`
Modelos reutilizáveis de gasto (usados por "simular mês"). `200` → `{ success: true, data: BudgetTemplate[] }`.

### `POST /budgets/templates` 🔒 `[admin]`
Body: `{ description, category, amount }`. `201` → `{ success: true, data: BudgetTemplate }`.

### `DELETE /budgets/templates/:id` 🔒 `[admin]`
`200` → `{ success: true, message: "Modelo removido com sucesso" }`.

### `GET /budgets/:year/:month` 🔒 `[admin, resident]`
`200` → `{ success: true, data: { budgets: Budget[], budgetsTotal, activeResidents, perPersonDivision } }`.

### `POST /budgets/simulate/:year/:month` 🔒 `[admin]`
Instancia todos os templates configurados como orçamento deste mês — **idempotente por descrição** (não duplica um template já simulado no mês).
`201` → `{ success: true, data: Budget[], message }`.

### `POST /budgets/:id/apply` 🔒 `[admin]`
Converte um orçamento planejado em despesa real (`ExpenseFactory`, `expenseDate: hoje`).
- `200` → `{ success: true, data: Budget }` (com `isApplied: true`, `appliedExpenseId`)
- `404` — orçamento não encontrado
- `409` — já foi aplicado

### `PUT /budgets/:id` 🔒 `[admin]`
Body: `{ amount }`. `200` → `{ success: true, data: Budget }` · `400` — `amount` inválido · `404` — não encontrado.

### `DELETE /budgets/:id` 🔒 `[admin]`
`200` → `{ success: true, message: "Orçamento removido com sucesso" }`.

**Formato de `Budget`:** `{ id, month ("YYYY-MM"), description, amount, category, isApplied }`. **`BudgetTemplate`:** `{ id, description, category, amount, createdAt }`.

---

## Payments — `/api/payments`

**⚠️ Nenhuma rota deste módulo exige autenticação** — gap conhecido, ver [docs/andamento.md](andamento.md).

### `GET /payments?month=YYYY-MM&residentId=`
`month` é obrigatório. `residentId` opcional filtra por morador.
`200` → `{ success: true, data: Payment[] }` · `400` — `month` ausente.

### `POST /payments`
Body: `{ residentId, month, amount, proofUrl?, notes? }`.
`201` → `{ success: true, data: Payment }`.

### `DELETE /payments/:id`
`200` → `{ success: true, message: "Pagamento removido" }`.

**Formato de `Payment`:** `{ id, residentId, month, amount, proofUrl, notes, createdAt }`.

---

## Monthly Balance — `/api/monthly-balance`

Módulo central do fechamento mensal — todas exigem 🔒.

### `GET /monthly-balance/:year/:month` `[admin, resident]`
Recalcula (e persiste) o saldo de todos os moradores a cada chamada.
`200` →
```json
{
  "success": true,
  "data": {
    "month": "2026-06",
    "totalExpenses": 0,
    "activeResidents": 0,
    "perPersonAmount": 0,
    "balances": [{
      "residentId": "...", "residentName": "...", "nickname": "...",
      "isActive": true, "exitDay": null, "proportionalFactor": 1,
      "payments": [], "totalPaid": 0,
      "previousBalance": 0, "currentMonthDue": 0, "totalDue": 0, "remainingBalance": 0
    }],
    "expenses": [{ "id": "...", "description": "...", "category": "...", "expenseDate": "...", "amount": 0 }],
    "manager": null
  }
}
```
(`manager` é sempre `null` — módulo de responsável mensal não existe mais, ver [docs/andamento.md](andamento.md).)

### `PUT /monthly-balance/:year/:month/:residentId/status` `[admin]`
Body: `{ isActive: boolean }`. Ativa/inativa o morador **só naquele mês**, sem afetar o cadastro. `200` → `{ success: true, data: MonthlyBalance }`.

### `PUT /monthly-balance/:year/:month/:residentId/proportional` `[admin]`
Body: `{ exitDay: number }` (1–31). Define o dia de saída e recalcula `proportionalFactor`. `200` → `{ success: true, data: MonthlyBalance }`.

### `DELETE /monthly-balance/:year/:month/:residentId/proportional` `[admin]`
Remove o cálculo proporcional (volta a `exitDay: null`, `proportionalFactor: 1`). `200` → `{ success: true, data: MonthlyBalance }`.

### `POST /monthly-balance/:year/:month/:residentId/payment` `[admin]`
Body: `{ amount }`. Registra um pagamento do morador para o mês. `201` → `{ success: true, data: Payment }`.

### `DELETE /monthly-balance/payment/:paymentId` `[admin]`
Remove um lançamento de pagamento específico. `200` → `{ success: true }`.

---

## Reports — `/api/reports`

**⚠️ Rota pública** — gap conhecido, ver [docs/andamento.md](andamento.md).

### `GET /reports/monthly?year=&month=`
`400` se `year`/`month` ausentes.
`200` →
```json
{
  "success": true,
  "data": {
    "year": 2026, "month": 6, "monthKey": "2026-06",
    "expenses": { "total": 0, "count": 0, "byCategory": { "Moradia": 0 } },
    "balances": {
      "totalCollected": 0, "totalPending": 0,
      "paidCount": 0, "pendingCount": 0,
      "adimplencyRate": 0,
      "perResident": []
    },
    "activeResidentCount": 0,
    "generatedAt": "..."
  }
}
```

---

## Códigos de status usados

| Código | Quando |
|--------|--------|
| `200` | Sucesso em GET/PUT/DELETE |
| `201` | Recurso criado (POST) |
| `400` | Validação de entrada (parâmetros ausentes/inválidos) — **exceto** erros lançados pelas factories dentro das rotas, que viram `500` (ver gap acima) |
| `401` | Token ausente/inválido/expirado, ou credenciais erradas no login |
| `403` | Autenticado mas sem permissão para a ação (RBAC ou "só edita a si mesmo") |
| `404` | Recurso não encontrado |
| `409` | Conflito (nickname/nome de categoria duplicado, orçamento já aplicado) |
| `500` | Erro não tratado (inclui os erros de validação das factories, ver acima) |
