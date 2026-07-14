# Decisões Técnicas

> Última atualização: Julho de 2026

Registro curto (estilo ADR) do "porquê" das escolhas de arquitetura do projeto — para quem entrar depois não precisar adivinhar ou repetir a pergunta. Para o "o quê" (estrutura de pastas, camadas), ver [docs/architecture.md](architecture.md).

---

## Singleton na conexão com o MongoDB

**Decisão:** `DatabaseConnection.getInstance()` (`backend/src/config/database.ts`) garante uma única instância de conexão durante todo o ciclo de vida do processo, em vez de abrir uma conexão nova por requisição ou por repository.

**Por quê:** o driver do MongoDB já mantém um pool de conexões internamente — abrir múltiplos `MongoClient` seria desperdício de conexões TCP e complicaria o encerramento gracioso do processo. Um único ponto de acesso também simplifica os testes de integração, que podem mockar `DatabaseConnection.getInstance()` uma vez.

---

## Repository + Factory, sem injeção de dependência

**Decisão:** cada módulo de rota instancia o repository diretamente (`new ResidentRepository()`) ou importa a instância singleton exportada por `app/appContext.ts` — não há um container de DI.

**Por quê:** o projeto é pequeno o suficiente para que DI adicionasse cerimônia sem benefício real. A separação em camadas (rota → factory valida/monta → repository persiste) já isola a lógica de negócio do acesso a banco, que é o problema que DI resolveria aqui de qualquer forma.

**Trade-off aceito:** os testes de integração não podem injetar um mock via construtor — eles mockam a **classe** do repository inteira com `vi.mock(...)` (ver [docs/testes.md](testes.md)). Funciona igual para os dois padrões de instanciação do projeto, mas é mais frágil a mudanças de import.

---

## Multi-tenancy por linha (row-level), não por schema

**Decisão:** todas as repúblicas compartilham as mesmas coleções do MongoDB; o isolamento é feito filtrando por `republicId` em cada query, não por banco/schema separado por república.

**Por quê:** é a forma mais simples de suportar múltiplas repúblicas sem replicar infraestrutura (um MongoDB por cliente seria operacionalmente muito mais caro para o tamanho do projeto). O risco — esquecer o filtro em uma query nova e vazar dados entre repúblicas — é mitigado por convenção: toda rota que lista dados recebe `req.user.republicId` do `authMiddleware` e passa adiante.

**Gap conhecido:** nem toda rota segue essa convenção — `payments` não tem `republicId` no modelo e `reports/monthly` usa um `SYSTEM_USER` fixo em vez do usuário autenticado, então essas duas não isolam por república hoje (ver [docs/autenticacao-e-autorizacao.md](autenticacao-e-autorizacao.md)).

---

## Sem exclusão nem desativação de morador

**Decisão:** `ResidentRepository` não expõe um método `delete`. Não existe `DELETE /api/residents/:id`. A "saída" de um morador é tratada só no contexto de um mês específico (`PUT /monthly-balance/:year/:month/:residentId/status` ou `.../proportional`), sem tocar no cadastro global.

**Por quê:** apagar ou desativar globalmente um morador quebraria o histórico de pagamentos e saldos mensais já persistidos (`Payment`/`MonthlyBalance` referenciam `residentId`, sem cascade). Um morador pode ter saído fisicamente da república mas ainda ter pendências financeiras a acertar — o cadastro precisa continuar existindo para isso fazer sentido. Isso é uma evolução da versão anterior do sistema, que tinha soft-delete (`isActive: false`) — o soft-delete foi removido em favor do controle por mês.

---

## Cota dividida pelo peso proporcional, não pela contagem de moradores

**Decisão:** `calculateMonthlyShare` divide o total de despesas pela **soma dos `proportionalFactor`** dos moradores ativos no mês, não pelo número de moradores.

**Por quê:** com entrada/saída no meio do mês, dividir por contagem de cabeças deixaria a soma das cotas individuais diferente do total de despesas (sobra ou falta dinheiro na conta da república). Dividir pelo peso proporcional garante que a soma sempre feche exatamente — ver a fórmula completa em [docs/modelo-de-dados.md](modelo-de-dados.md).

---

## JWT revalidado contra o banco a cada requisição

**Decisão:** `authMiddleware` não confia só na assinatura do JWT — depois de verificá-la, busca o usuário no Mongo por `_id` com `isActive: true` e usa o `role`/`republicId` **do banco**, não os que vieram no payload do token.

**Por quê:** um JWT sozinho continua válido até expirar, mesmo que o usuário seja desativado ou tenha o papel alterado nesse meio-tempo. Revalidar contra o banco troca um pouco de performance (uma query a mais por requisição autenticada) por essa garantia de que mudanças de acesso valem imediatamente, sem esperar o token expirar (padrão `JWT_EXPIRES_IN=8h`).

---

## Testes de integração mockam o repository, não sobem MongoDB real

**Decisão:** os testes de rota (`backend/tests/modules/*.test.ts`) usam `supertest` contra a app real, mas mockam a classe de cada repository com `vi.mock(...)` + `vi.hoisted()`, em vez de rodar contra um MongoDB de teste (in-memory ou container).

**Por quê:** elimina a necessidade de subir infraestrutura no CI e deixa os testes rápidos e determinísticos. O RBAC (`authorize`), as factories e o cálculo de `monthlyBalance.utils` rodam de verdade — só a camada de persistência é substituída. Documentado com mais detalhe em [docs/testes.md](testes.md), junto dos gaps que essa estratégia deixou visíveis (rotas sem `authMiddleware`, ausência de middleware de erro global).

---

## Lint fora do CI

**Decisão:** o workflow `.github/workflows/ci.yml` roda typecheck, testes com cobertura e build — mas não `lint`.

**Por quê:** os dois `package.json` têm um script `lint` (`eslint`), mas não existe nenhum arquivo de configuração do ESLint no repositório (nem `.eslintrc*`, nem `eslint.config.js`). Rodar `pnpm lint` hoje falha imediatamente em qualquer branch. Colocar isso como step obrigatório deixaria o CI vermelho a partir do primeiro commit — ficou fora até alguém decidir a versão do ESLint (8 com `.eslintrc` vs. 9 com flat config), que é uma decisão de escopo maior do que a tarefa que introduziu o CI.
