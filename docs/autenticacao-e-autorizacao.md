# Autenticação e Autorização

> Última atualização: Julho de 2026

## Visão geral

O sistema usa **JWT stateless** (biblioteca `jose`, algoritmo HS256) para autenticação e um **RBAC de dois papéis** (`admin` / `resident`) para autorização. Não existe cadastro de "repúblicas" — o papel `admin` e o conceito de república nascem juntos no registro (ver [docs/architecture.md](architecture.md#conceito-central-multi-tenancy-por-república)).

---

## Fluxo de registro e login

1. **`POST /api/auth/register`** — `{ nickname, password }`. Cria um usuário `role: 'admin'` com um `republicId` novo (`randomUUID()`). Esse usuário **não é um morador**: não aparece em `GET /residents`, não entra na divisão de despesas, não tem saldo mensal. Ele é o "dono" da república.
2. **`POST /api/auth/login`** — `{ identifier, password }` (`identifier` = nickname). Verifica a senha com `argon2.verify` contra o `passwordHash` salvo.
3. Ambos retornam `{ accessToken, resident }`. O token carrega no payload: `sub` (id do Mongo), `role`, `republicId`. Expira em `JWT_EXPIRES_IN` (padrão `8h`).
4. O frontend guarda o token em `localStorage` (`caixinha_token`) e o residente em `caixinha_resident`, injetando `Authorization: Bearer <token>` em toda chamada via interceptor do axios (`services/api.ts`).

### Moradores não se registram sozinhos

Só o admin cria moradores, via `POST /api/residents`. Se não informar uma senha, uma temporária de 12 caracteres hex é gerada (`generateTempPassword`) e devolvida na resposta (`generatedPassword`) — só nesse momento, nunca mais depois. O morador criado tem `mustChangePassword: true`.

### Troca de senha obrigatória

Enquanto `mustChangePassword` for `true`, o frontend redireciona para `/change-password` (`PrivateRoute` em `App.tsx`) antes de deixar acessar qualquer outra tela. `POST /api/auth/change-password` exige a senha atual, gera um novo hash e limpa a flag.

---

## Middleware de autenticação — `authMiddleware`

Arquivo: `backend/src/shared/middlewares/authMiddleware.ts`.

1. Lê `Authorization: Bearer <token>` — `401` se ausente ou mal formado.
2. Verifica a assinatura/expiração do JWT (`verifyAccessToken`) — `401` se inválido/expirado.
3. **Revalida contra o banco**: busca o usuário por `_id` (do `sub` do token) com `isActive: true`. Se não encontrar, `401`.
4. Popula `req.user = { id, role, republicId }` — **`role` e `republicId` vêm do banco, não do token**, então uma mudança de papel ou desativação já se reflete na próxima requisição, mesmo com o token antigo ainda válido.

Esse passo 3 é o que torna o sistema mais seguro que um JWT "puro": um token roubado de um usuário desativado para de funcionar assim que a desativação é salva no banco, sem esperar o token expirar.

## Middleware de autorização — `authorize`

Arquivo: `backend/src/shared/middlewares/authorize.ts`. Recebe uma lista de papéis permitidos e é usado **explicitamente em cada rota**, depois de `authMiddleware`:

```ts
residentRoutes.post('/', authMiddleware, authorize('admin'), ...);
budgetRoutes.get('/templates', authMiddleware, authorize('admin', 'resident'), ...);
```

Sem `req.user` → `401`. Papel fora da lista → `403`.

### Matriz de permissões

| Ação | admin | resident |
|------|:-----:|:--------:|
| Ver lista de moradores | ✅ | ✅ |
| Criar morador | ✅ | ❌ |
| Editar o próprio cadastro | ✅ | ✅ |
| Editar cadastro de outro morador | ✅ | ❌ (403) |
| Mudar `category` de um morador | ✅ | ❌ (campo ignorado no PUT) |
| CRUD de despesas | ✅ | ✅ |
| Criar/remover categoria | ✅ | ❌ |
| Ver orçamentos/templates | ✅ | ✅ |
| Criar/simular/aplicar/editar/remover orçamento | ✅ | ❌ |
| Ver fechamento mensal | ✅ | ✅ |
| Ativar/desativar morador no mês, cálculo proporcional, lançar pagamento pelo fechamento | ✅ | ❌ |
| `payments` e `reports/monthly` | ✅ (rota pública, sem checagem) | ✅ (idem) |

O hook `usePermissions` (`frontend/src/hooks/usePermissions.ts`) espelha essa mesma matriz no client, para esconder botões de ação que dariam 403 — é só UX, a garantia real está nos middlewares do backend.

---

## Gaps conhecidos de autorização

Achados durante os testes de integração (ver [docs/testes.md](testes.md)) e ainda não corrigidos:

- **`payments` (`GET`/`POST`/`DELETE /api/payments`) não passa por `authMiddleware`** — é pública, ao contrário de todo o resto da API escrita.
- **`GET /api/reports/monthly` também não passa por `authMiddleware`** — qualquer um pode ler o relatório consolidado do mês de qualquer república, já que a rota nem filtra por `republicId` (usa um `SYSTEM_USER` fixo internamente).

Essas duas rotas não vazam senhas nem dados de outras rotas, mas vazam dados financeiros da república sem exigir login. Corrigir isso é adicionar `authMiddleware` (e `authorize`, e o filtro por `republicId` em `reports`) nessas rotas — não é uma mudança arquitetural, só não foi feita ainda.

---

## Segurança de senha

- Hash com **argon2** (`argon2.hash`/`argon2.verify`), não bcrypt nem texto puro.
- Senha mínima de 6 caracteres no registro (`POST /auth/register`); não há validação de força além disso em nenhuma rota.
- `passwordHash` nunca é retornado em nenhuma resposta da API (`toAuthResident`/`toResidentDTO` filtram os campos manualmente).
