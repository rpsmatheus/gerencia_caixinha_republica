# Caixinha App - Sistema de Gestão Financeira para Repúblicas

O **Caixinha App** é uma solução web robusta e moderna projetada especificamente para automatizar, centralizar e simplificar a gestão financeira e a convivência de moradores em repúblicas estudantis e moradias compartilhadas.

---

## 📋 Sumário
- [Descrição Geral](#-descrição-geral)
- [O Problema e Alinhamento com os ODS](#-o-problema-e-alinhamento-com-os-ods)
- [Público-Alvo](#-público-alvo)
- [Tecnologias Previstas](#-tecnologias-previstas)
- [Equipe e Integrantes](#-equipe-e-integrantes)

---

## 🔍 Descrição Geral

Nas repúblicas estudantis, a divisão de despesas mensais (a famosa "caixinha") costuma ser um processo manual, descentralizado e altamente suscetível a erros. O **Caixinha App** surge para eliminar planilhas confusas e mensagens perdidas em aplicativos de conversa. 

O sistema oferece um controle completo do fluxo de caixa residencial através de:
* **Gerenciamento Dinâmico de Moradores:** Cadastro categorizado (ex: Moradores, Agregados, "Bixos") com controle de status ativo/inativo para os cálculos do mês.
* **Fluxo de Despesas Inteligente:** Registro detalhado de gastos, separando despesas comuns (divididas igualmente) de despesas extras (individuais) com suporte a upload de comprovantes.
* **Inteligência de Fechamento Mensal:** Lógica automatizada para cálculo de saldos, considerando o tempo de permanência de cada morador no mês (fator proporcional) e histórico de saldos anteriores.
* **Previsibilidade Financeira:** Criação e simulação de orçamentos mensais para evitar surpresas no fim do mês.
* **Dashboards e Análises Visuais:** Gráficos interativos para monitoramento de adimplência, gastos por categoria e saúde financeira da casa.

---

## 🎯 O Problema e Alinhamento com os ODS

### O Problema
A gestão de uma moradia compartilhada envolve conciliar diferentes realidades financeiras, rotinas e consumos. Os principais desafios enfrentados por esse cenário incluem:
1. **Falta de transparência:** Dificuldade em auditar para onde o dinheiro da casa está indo.
2. **Inadimplência e desorganização:** Esquecimento de prazos e perda de comprovantes de pagamento.
3. **Injustiça nos cálculos:** Complexidade para recalcular as contas manualmente quando um morador passa apenas metade do mês na residência.

### Relação com os Objetivos de Desenvolvimento Sustentável (ODS)
O Caixinha App está diretamente alinhado com a Agenda 2030 da Organização das Nações Unidas (ONU), impactando as seguintes metas:

* **ODS 12: Consumo e Produção Responsáveis**
  * *Meta:* Promover a gestão sustentável e o uso eficiente dos recursos naturais e compartilhados.
  * *Relação:* Ao categorizar detalhadamente os gastos com água, energia, alimentação e manutenção, o sistema conscientiza os moradores sobre seus padrões de consumo. O monitoramento visual inibe o desperdício de recursos escassos dentro da microrregião da moradia estudantil, incentivando hábitos mais sustentáveis e coletivos.
* **ODS 8: Trabalho Decente e Crescimento Econômico**
  * *Meta:* Promover a educação financeira, inclusão e ambientes organizados.
  * *Relação:* O aplicativo atua como uma ferramenta pedagógica de governança e saúde financeira para jovens universitários em transição para a vida adulta. A automação reduz o estresse gerencial e fomenta competências de planejamento econômico e adimplência.

---

## 👥 Público-Alvo

O sistema foi desenhado para atender às necessidades específicas de:
* **Repúblicas Universitárias Tradicionais:** Que possuem regras próprias de hierarquia e divisão (moradores fixos, bixos, agregados).
* **Estudantes de Graduação e Pós-Graduação:** Jovens que necessitam de transparência e agilidade na divisão de contas devido à rotina acadêmica intensa.
* **Moradias Compartilhadas (Co-living):** Grupos de jovens profissionais ou indivíduos que dividem despesas básicas (aluguel, internet, contas de consumo) e buscam uma plataforma neutra para evitar conflitos interpessoais.

---

## 🛠️ Tecnologias Previstas

A arquitetura do projeto foi planejada utilizando TypeScript de ponta a ponta para garantir segurança em tempo de compilação, modularidade e manutenibilidade.

### Frontend
* **React (com Vite):** Biblioteca base para a construção de uma interface de usuário de alto desempenho, componentizada e reativa.
* **TailwindCSS:** Framework utilitário de CSS para o desenvolvimento de um design responsivo, moderno e limpo.
* **Chart.js & React-Chartjs-2:** Renderização de gráficos dinâmicos para a análise visual de despesas e saldos.

### Backend
* **Node.js + Express:** Ambiente de execução e micro-framework ágeis para a construção de uma API RESTful escalável.
* **TypeScript:** Tipagem estática aplicada a modelos, controladores e repositórios para mitigar bugs de tipagem no ecossistema Javascript.

### Banco de Dados & Infraestrutura
* **MongoDB:** Banco de dados NoSQL baseado em documentos, ideal para a flexibilidade exigida no histórico de despesas e estruturas de relatórios.
* **Docker & Docker Compose:** Containerização completa da aplicação, permitindo que o frontend, o backend e o banco de dados rodem de forma idêntica e isolada em qualquer ambiente de desenvolvimento ou produção.

---

## 👥 Lista dos Integrantes

O projeto é desenvolvido pela equipe de Engenharia de Software composta por:

* ALEJANDRO MARTINS DE FREITAS
* BIANCA BARRETO LEME
* KARINA MIYU KINUKAWA
* LUIZ MIGUEL WOJTYLA ABREU SIQUEIRA
* MATHEUS RODRIGUES PEREIRA DE SOUZA
