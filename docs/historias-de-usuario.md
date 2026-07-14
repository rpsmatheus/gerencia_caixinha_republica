# Histórias de Usuário

> Última atualização: Julho de 2026

Lista de histórias de usuário do Caixinha App e o status real de implementação de cada uma, para acompanhamento da disciplina. Legenda:

- ✅ **Implementado** — funciona como descrito na história.
- ⚠️ **Implementado parcialmente** — existe uma versão da funcionalidade, mas diferente ou mais limitada do que a história original previa.
- ❌ **Não implementado** — não existe, com o motivo da decisão.

---

## Moradores

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 1 | Como admin, quero cadastrar um morador, para controlar quem mora na república. | ✅ | `POST /api/residents` |
| 2 | Como usuário, quero visualizar a lista de moradores, para saber quem faz parte da república. | ✅ | `GET /api/residents` |
| 3 | Como usuário, quero buscar um morador pelo nome/apelido, para encontrá-lo rapidamente numa lista grande. | ✅ | `GET /api/residents?search=` filtra por nome completo ou apelido; a tela de Moradores tem campo de busca com debounce. |
| 4 | Como usuário, quero editar os dados de um morador, para manter o cadastro atualizado. | ✅ | `PUT /api/residents/:id` — o próprio morador edita a si mesmo; admin edita qualquer um. |
| 5 | Como admin, quero ativar/desativar um morador, para controlar quem está contando na divisão da caixinha. | ⚠️ | **Erro de modelagem original**: a história foi escrita pensando em ativar/desativar o *cadastro* do morador globalmente, mas isso nunca fez sentido de verdade — desativar globalmente apagaria a referência para o histórico de pagamentos dele. O que existe de fato é ativar/desativar **por mês** (história 18), que é o comportamento correto. A lição foi: essa história deveria ter nascido já como "por mês", não como um toggle global. |
| 6 | Como admin, quero excluir um morador, para remover alguém que saiu definitivamente da república. | ❌ | Removido de propósito — excluir apagaria o histórico financeiro (pagamentos e saldos) vinculado ao morador. Ver [decisoes-tecnicas.md](decisoes-tecnicas.md#sem-exclusão-nem-desativação-de-morador). |

## Despesas

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 7 | Como usuário, quero registrar uma despesa, para lançar um gasto da república. | ✅ | `POST /api/expenses` |
| 8 | Como usuário, quero visualizar as despesas, para acompanhar os gastos do mês. | ✅ | `GET /api/expenses` (paginado) |
| 9 | Como usuário, quero filtrar despesas (categoria, valor, data, busca por descrição), para achar um lançamento específico. | ✅ | `GET /api/expenses?category=&minAmount=&maxAmount=&search=&startDate=&endDate=` |
| 10 | Como usuário, quero editar uma despesa, para corrigir um lançamento errado. | ✅ | `PUT /api/expenses/:id` |
| 11 | Como usuário, quero excluir uma despesa, para remover um lançamento indevido. | ✅ | `DELETE /api/expenses/:id` |
| 12 | Como admin, quero gerenciar categorias de despesa, para organizar os gastos como a república preferir. | ✅ | `GET/POST/DELETE /api/categories`, customizadas por república. |
| 13 | Como usuário, quero marcar uma despesa como "extra" (fora da divisão padrão), para separar gastos individuais dos coletivos. | ❌ | Removido — decidimos que era uma regra de negócio específica demais para um app que queremos manter genérico; hoje toda despesa listada entra igualmente no cálculo da cota mensal. |
| 14 | Como usuário, quero anexar o comprovante de uma despesa (upload), para guardar prova do gasto. | ✅ | Implementado como URL externa em `proofUrl`: o usuário informa o link do arquivo/imagem/PDF no cadastro ou edição da despesa e pode abrir/visualizar depois. O projeto não hospeda binários. |
| 15 | Como usuário, quero visualizar um resumo das despesas, para entender o total gasto rapidamente. | ✅ | Resumo por categoria em `GET /api/reports/monthly` e nos gráficos de Analytics. |

## Fechamento Mensal

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 16 | Como usuário, quero que o saldo mensal de cada morador seja calculado automaticamente, para não precisar fazer conta manual. | ✅ | `GET /api/monthly-balance/:year/:month` recalcula e persiste a cada chamada. |
| 17 | Como admin, quero que o cálculo aplique um fator proporcional para quem entrou/saiu no meio do mês, para que a divisão seja justa. | ✅ | `PUT /api/monthly-balance/:year/:month/:residentId/proportional` — ver a fórmula em [modelo-de-dados.md](modelo-de-dados.md#regra-de-negócio-cálculo-da-cota-mensal). |
| 18 | Como admin, quero ativar/desativar um morador especificamente num mês, para excluí-lo da divisão daquele mês sem mexer no cadastro dele. | ✅ | `PUT /api/monthly-balance/:year/:month/:residentId/status` |
| 19 | Como usuário, quero visualizar o saldo detalhado de um morador (histórico, pagamentos, cota do mês), para entender exatamente quanto ele deve. | ✅ | Incluído no painel de `GET /api/monthly-balance/:year/:month`. |

## Pagamentos

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 20 | Como usuário, quero registrar um pagamento de um morador, para dar baixa na dívida dele. | ✅ | `POST /api/payments` e `POST /api/monthly-balance/:year/:month/:residentId/payment` |
| 21 | Como admin, quero excluir um pagamento lançado errado, para corrigir o saldo do morador. | ✅ | `DELETE /api/payments/:id` |

## Relatórios

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 22 | Como admin, quero gerar um relatório mensal consolidado, para ter uma visão geral do mês (despesas, arrecadação, adimplência). | ✅ | `GET /api/reports/monthly` |

## Orçamentos

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 23 | Como admin, quero criar um orçamento planejado no mês, para reservar um valor antes do gasto acontecer. | ✅ | Até pouco tempo atrás só era possível gerar orçamento a partir de "Simular Mês Padrão" (história 25). Adicionamos `POST /api/budgets/:year/:month` para criar um orçamento avulso direto no mês, sem depender de um modelo — a história está completa agora. |
| 24 | Como usuário, quero visualizar os orçamentos do mês, para saber o que já foi planejado. | ✅ | `GET /api/budgets/:year/:month` |
| 25 | Como admin, quero simular um "mês padrão" a partir de modelos configurados (água, luz, internet...), para não recriar os mesmos orçamentos todo mês. | ✅ | `POST /api/budgets/simulate/:year/:month`, idempotente por descrição. |
| 26 | Como admin, quero aplicar um orçamento planejado como despesa real, para confirmar que o gasto de fato aconteceu. | ✅ | `POST /api/budgets/:id/apply` |
| 27 | Como admin, quero editar o valor de um orçamento, para ajustar uma estimativa. | ✅ | `PUT /api/budgets/:id` |
| 28 | Como admin, quero excluir um orçamento planejado, para remover algo que não vai mais acontecer. | ✅ | `DELETE /api/budgets/:id` |

## Dashboard e Métricas

| # | História | Status | Observação |
|---|----------|:------:|------------|
| 29 | Como usuário, quero visualizar um gráfico de despesas por categoria, para entender onde o dinheiro está sendo gasto. | ✅ | Tela de Analytics. |
| 30 | Como usuário, quero visualizar um gráfico de saldo por morador, para comparar quem está em dia e quem está devendo. | ✅ | Tela de Analytics. |
| 31 | Como usuário, quero visualizar métricas financeiras gerais (totais, adimplência), para ter uma visão rápida da saúde financeira da república. | ✅ | Tela de Analytics + `GET /api/reports/monthly`. |

---

## Resumo

| Status | Quantidade |
|--------|:----------:|
| ✅ Implementado | 29 |
| ⚠️ Implementado parcialmente | 1 |
| ❌ Não implementado | 1 |
| **Total** | **31** |

Detalhes técnicos de cada módulo em [architecture.md](architecture.md) e [api.md](api.md); o progresso por sprint está em [andamento.md](andamento.md).
