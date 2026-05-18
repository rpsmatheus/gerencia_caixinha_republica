# Planejamento do Projeto: Sistema de Gestão de Repúblicas

## 1. Introdução

Este documento apresenta o planejamento de 10 semanas para o desenvolvimento de um sistema de gestão de repúblicas. O objetivo principal é criar uma plataforma robusta que suporte múltiplas repúblicas de forma isolada (multi-tenancy), permitindo que cada república tenha seu próprio conjunto de usuários (moradores) com diferentes níveis de acesso e permissões (Role-Based Access Control - RBAC).

## 2. Conceitos Fundamentais

### 2.1. Multi-Tenancy (Multi-República)

O sistema será projetado para hospedar e gerenciar dados de várias repúblicas de forma independente. Cada república terá seu próprio espaço de dados lógico, garantindo que os dados de uma república não sejam acessíveis por outra. O login inicial permitirá a seleção ou identificação da república à qual o usuário pertence.

### 2.2. Controle de Acesso Baseado em Papéis (RBAC)

Serão definidos papéis específicos para os usuários dentro de cada república, como "Administrador da República" e "Morador". Cada papel terá um conjunto predefinido de permissões que determinará quais funcionalidades e dados o usuário pode acessar ou modificar. Isso garante que os moradores tenham acesso restrito apenas às funcionalidades relevantes para eles.

## 3. Cronograma de Sprints (10 Semanas)

O projeto será dividido em 10 sprints semanais, com objetivos claros para cada uma. As tarefas detalhadas de sprints futuras serão definidas conforme o progresso do projeto.

### Sprint 1: Módulo de Despesas

**Objetivos Principais:**
*   Desenvolvimento completo do módulo de despesas (CRUD).
*   Implementação de filtros e listagens de despesas.
*   Configuração do ambiente de desenvolvimento (Backend e Frontend).
*   Implementação da estrutura de banco de dados inicial.

### Sprint 2: Módulo de Categorias e Orçamentos

**Objetivos Principais:**
*   Desenvolvimento do módulo de categorias de despesas (CRUD).
*   Implementação do módulo de orçamentos, permitindo que cada república defina seus limites de gastos.
*   Associação de categorias e orçamentos à república.

### Sprint 3: Módulo de Pagamentos e Fechamento Mensal (Parte 1)

**Objetivos Principais:**
*   Desenvolvimento do módulo de pagamentos.
*   Início da implementação do módulo de fechamento mensal, calculando saldos e dívidas.

### Sprint 4: Módulo de Fechamento Mensal (Parte 2) e Relatórios

**Objetivos Principais:**
*   Finalização do módulo de fechamento mensal, incluindo status de moradores e gerenciamento.
*   Criação de relatórios básicos de despesas e saldos para administradores da república.

### Sprint 5: Configuração Inicial e Autenticação Base

**Objetivos Principais:**
*   Desenvolvimento do módulo de autenticação de usuários (registro e login) com username e senha.
*   Geração e validação de tokens JWT com expiração.

### Sprint 6: Módulo de Moradores e RBAC

**Objetivos Principais:**
*   Desenvolvimento do módulo de gerenciamento de moradores dentro de cada república (CRUD).
*   Implementação do sistema de RBAC, definindo papéis (ex: Administrador, Morador) e suas permissões.
*   Aplicação do middleware de autorização nas rotas do backend.
*   Garantia do isolamento de dados de despesas, pagamentos e fechamentos por república e por usuário (onde aplicável).

### Sprint 7: Multi-Tenancy e Gerenciamento de Repúblicas

**Objetivos Principais:**
*   Implementação da lógica de multi-tenancy no backend, associando usuários a repúblicas.
*   Criação do módulo de gerenciamento de repúblicas (CRUD para administradores do sistema).
*   Ajustes no processo de login para identificar a república do usuário.

### Sprint 8: Frontend - Dashboard e Interface de Usuário

**Objetivos Principais:**
*   Desenvolvimento do dashboard principal do frontend, exibindo informações relevantes para cada papel.
*   Criação das interfaces de usuário para os módulos de despesas e categorias.
*   Integração do frontend com as APIs do backend, respeitando o RBAC.

### Sprint 9: Frontend - Gerenciamento e Experiência do Usuário

**Objetivos Principais:**
*   Desenvolvimento das interfaces de usuário para os módulos de moradores, orçamentos e pagamentos.
*   Implementação de funcionalidades de busca, filtro e paginação no frontend.
*   Melhorias na experiência do usuário (UX) e responsividade da interface.

### Sprint 10: Testes, Refinamento e Implantação

**Objetivos Principais:**
*   Realização de testes de integração e aceitação em todo o sistema.
*   Refinamento de funcionalidades e correção de bugs.
*   Preparação para implantação (documentação, scripts de deploy).
*   Revisão final do código e otimizações de performance.

## 4. Próximos Passos

Após a aprovação deste planejamento, iniciaremos a Sprint 1, focando no módulo de despesas — a funcionalidade central do sistema.


## Link Quadro Kanban
https://github.com/users/rpsmatheus/projects/2
