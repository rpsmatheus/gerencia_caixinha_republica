# Guia de Contribuição

> Última atualização: Julho de 2026

## Antes de começar

Suba o projeto seguindo o [README](../README.md) (Docker ou modo local). Leia [docs/architecture.md](architecture.md) para entender as camadas do backend e a estrutura do frontend antes de mexer em código novo.

---

## Branches

Nome no formato `tipo/descricao-curta-em-kebab-case`, a partir de `main` atualizada:

```bash
git checkout main
git pull origin main
git checkout -b feat/nome-da-feature
```

Tipos usados no histórico do projeto: `feat/`, `fix/`, `test/`, `docs/`, `refactor/`.

---

## Commits

Mensagem no padrão `tipo: resumo curto no imperativo`, corpo opcional explicando o *porquê* (não o *o quê* — o diff já mostra o quê):

```
test: adiciona testes de integração das rotas do backend

Cobre os 8 módulos de rota com supertest, mockando apenas as classes
de repository e o authMiddleware — authorize (RBAC), as factories e
o cálculo de monthlyBalance.utils rodam de verdade.
```

Tipos: `feat` (funcionalidade nova), `fix` (correção de bug), `test` (testes), `docs` (documentação), `refactor` (mudança de estrutura sem alterar comportamento).

---

## Checklist antes de abrir um PR

O CI (`.github/workflows/ci.yml`) roda isto automaticamente em todo push/PR para `main` — rodar localmente primeiro evita ida e volta:

```bash
cd backend  && pnpm install && pnpm exec tsc --noEmit && pnpm test:coverage -- --run && pnpm build
cd frontend && pnpm install && pnpm exec tsc --noEmit && pnpm test:coverage -- --run && pnpm build
```

- [ ] `tsc --noEmit` sem erros (backend e frontend)
- [ ] `pnpm test` passando (backend e frontend)
- [ ] `pnpm build` funcionando nos dois lados
- [ ] Se mexeu em uma rota/regra de negócio: endpoint novo documentado em [docs/api.md](api.md), fórmula nova em [docs/modelo-de-dados.md](modelo-de-dados.md)
- [ ] Se o comportamento de uma funcionalidade descrita em [docs/andamento.md](andamento.md) mudou, atualizar a sprint correspondente

> **Não rode `pnpm lint`** como gate — não há configuração de ESLint no repositório ainda, o comando falha em qualquer branch (ver [docs/decisoes-tecnicas.md](decisoes-tecnicas.md)).

---

## Adicionando um módulo novo no backend

Seguindo o padrão dos módulos existentes (`residents`, `expenses`, `budgets`...):

1. **Model** (`src/models/NomeDoModulo.ts`) — interface TypeScript pura, sem lógica.
2. **Factory** (`src/factories/NomeDoModuloFactory.ts`) — valida o DTO de entrada e monta o objeto pronto para persistir. Lança `Error` com mensagem curta para cada campo inválido (é assim que os outros módulos fazem — não existe uma classe de erro customizada ainda).
3. **Repository** (`src/repositories/NomeDoModuloRepository.ts`) — acesso ao Mongo via `DatabaseConnection.getInstance()`. Se a entidade pertence a uma república, todo método de leitura recebe e filtra por `republicId`.
4. **Rotas** (`src/modules/nome-do-modulo/nomeDoModulo.routes.ts`) — `authMiddleware` + `authorize(...roles)` em cada rota que precisa (compare com os módulos existentes para decidir quais papéis fazem sentido). Registra o repository via `app/appContext.ts` se for reaproveitado em outro módulo (como `budgets` reaproveita `expenseRepo`), ou instancia direto se for uso exclusivo do módulo.
5. Registrar o router em `src/app/routes.ts`.
6. **Testes**: um arquivo de teste de integração em `backend/tests/modules/`, seguindo o padrão de mock descrito em [docs/testes.md](testes.md) (mock da classe do repository com `vi.hoisted`, `authMiddleware` mockado via header `x-test-user`, `authorize` real).

## Adicionando uma tela nova no frontend

1. Componente em `frontend/src/pages/NomeDaTela.tsx`, consumindo a API via uma nova função em `frontend/src/services/api.ts` (siga o padrão existente: uma função por endpoint, usando a instância `api` do axios já configurada com o interceptor de token).
2. Registrar a rota em `App.tsx` dentro do bloco `PrivateRoute` (se exigir login) e adicionar o link de navegação em `DashboardLayout.tsx`.
3. Se a tela expõe ações restritas a admin, usar `usePermissions()` para condicionar a renderização dos botões — não confie só nisso para segurança, o backend já bloqueia via RBAC, mas a UI deve refletir o que o usuário pode fazer.
4. Testes: componentes de apresentação reutilizáveis vão em `frontend/tests/components/`; hooks/contexto em `frontend/tests/hooks/` e `frontend/tests/contexts/`. Testar as páginas inteiras (com `services/api.ts` mockado) ainda é um gap conhecido — ver [docs/andamento.md](andamento.md).

---

## Rodando os testes

```bash
cd backend  && pnpm test              # ou pnpm test:coverage
cd frontend && pnpm test              # ou pnpm test:coverage
```

Nenhum dos dois precisa de MongoDB rodando — tudo é mockado (ver [docs/testes.md](testes.md) para a estratégia completa).
