# Caixinha App

Sistema web para gestão financeira de repúblicas estudantis. Automatiza a divisão de despesas mensais, controle de pagamentos e fechamento da caixinha.

---

## Sumário

- [Descrição](#descrição)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Como subir o projeto](#como-subir-o-projeto)
- [Comandos Docker](#comandos-docker)
- [Rodar sem Docker (modo local)](#rodar-sem-docker-modo-local)
- [Rodar os testes](#rodar-os-testes)
- [Endpoints da API](#endpoints-da-api)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Equipe](#equipe)

---

## Descrição

O Caixinha App resolve o problema de gestão manual das despesas em repúblicas. O sistema permite:

- Cadastrar moradores e controlar status ativo/inativo
- Registrar despesas mensais por categoria (comuns e extras)
- Calcular automaticamente quanto cada morador deve pagar
- Registrar pagamentos e acompanhar adimplência
- Gerar relatórios consolidados do mês

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Banco de dados | MongoDB 7.0 |
| Infraestrutura | Docker + Docker Compose |
| Testes | Vitest |

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose instalados
- Para rodar localmente sem Docker: Node.js 20+ e pnpm

---

## Como subir o projeto

**1. Clone o repositório**
```bash
git clone https://github.com/rpsmatheus/gerencia_caixinha_republica.git
cd gerencia_caixinha_republica
```

**2. Configure as variáveis de ambiente**
```bash
cp .env.example .env
```
O `.env.example` já tem os valores padrão para desenvolvimento local. Não é necessário alterar nada para rodar com Docker.

**3. Suba os containers**
```bash
docker compose up -d --build
```

**4. Verifique que está funcionando**
```bash
curl http://localhost:3001/api/residents
# Esperado: {"success":true,"data":[],"total":0}
```

Acesse o frontend em: `http://localhost:5173`

---

## Comandos Docker

```bash
# Subir tudo (com rebuild das imagens)
docker compose up -d --build

# Subir sem rebuild (mais rápido quando não mudou código)
docker compose up -d

# Ver status dos containers
docker compose ps

# Ver logs do backend em tempo real
docker compose logs -f backend

# Ver logs do frontend
docker compose logs -f frontend

# Parar os containers (mantém os dados do banco)
docker compose down

# Parar e apagar os dados do banco (começar do zero)
docker compose down -v

# Reiniciar só o backend (útil após mudanças no código)
docker compose restart backend
```

---

## Rodar sem Docker (modo local)

Útil para desenvolvimento rápido sem precisar rebuildar imagens. Você precisa ter um MongoDB rodando localmente ou usar o MongoDB do Docker enquanto roda o backend fora.

**Subir só o MongoDB via Docker:**
```bash
docker compose up -d mongodb
```

**Instalar dependências e rodar o backend:**
```bash
cd backend
pnpm install
pnpm dev
```

**Em outro terminal, rodar o frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

O backend sobe em `http://localhost:3001` e o frontend em `http://localhost:5173`.

---

## Rodar os testes

Os testes ficam em `backend/tests/` e usam o Vitest. Não precisam de banco de dados — os repositories são mockados.

```bash
cd backend

# Instalar dependências (se ainda não instalou)
pnpm install

# Rodar todos os testes
pnpm test

# Rodar em modo watch (re-executa ao salvar arquivos)
pnpm test --watch

# Rodar com cobertura de código
pnpm test:coverage

# Rodar só um arquivo de teste específico
pnpm test tests/factories/ExpenseFactory.test.ts
```

---

## Endpoints da API

Base URL: `http://localhost:3001/api`

### Moradores
```
GET    /residents              Lista moradores (paginado)
POST   /residents              Cria morador
PUT    /residents/:id          Atualiza morador
DELETE /residents/:id          Desativa morador (soft-delete)
```

### Despesas
```
GET    /expenses               Lista com filtros: ?category=&isExtra=&search=&startDate=&endDate=
GET    /expenses/:id           Busca por ID
POST   /expenses               Cria despesa
PUT    /expenses/:id           Atualiza despesa
DELETE /expenses/:id           Remove despesa
```

### Categorias
```
GET    /categories             Lista categorias disponíveis
```

### Orçamentos
```
GET    /budgets/:republicaId/:year/:month    Orçamento do mês
POST   /budgets                              Cria orçamento
```

### Pagamentos
```
GET    /payments?month=YYYY-MM              Lista pagamentos do mês
GET    /payments?month=YYYY-MM&residentId=  Pagamentos de um morador
POST   /payments                            Registra pagamento
DELETE /payments/:id                        Remove pagamento
```

### Fechamento Mensal
```
GET    /monthly-balance?year=&month=              Saldos de todos os moradores
GET    /monthly-balance/:residentId?year=&month=  Saldo individual
POST   /monthly-balance/:residentId/payment       Registra pagamento e recalcula
```

### Relatórios
```
GET    /reports/monthly?year=&month=    Relatório consolidado do mês
```

---

## Variáveis de ambiente

O arquivo `.env.example` documenta todas as variáveis necessárias:

| Variável | Descrição | Padrão (dev) |
|----------|-----------|--------------|
| `MONGODB_URI` | String de conexão com o MongoDB | `mongodb://admin:password@mongodb:27017/caixinha?authSource=admin` |
| `PORT` | Porta do backend | `3001` |

---

## Equipe

Projeto desenvolvido na disciplina de Engenharia de Software:

- Alejandro Martins de Freitas
- Bianca Barreto Leme
- Karina Miyu Kinukawa
- Luiz Miguel Wojtyla Abreu Siqueira
- Matheus Rodrigues Pereira de Souza