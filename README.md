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
- [Publicar para uso por link](#publicar-para-uso-por-link)
- [Rodar os testes](#rodar-os-testes)
- [Endpoints da API](#endpoints-da-api)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Documentação](#documentação)
- [Equipe](#equipe)

---

## Descrição

O Caixinha App resolve o problema de gestão manual das despesas em repúblicas. É **multi-tenant**: cada conta que se registra vira administradora de uma república isolada das demais, com login por JWT e permissões diferentes para admin e morador. O sistema permite:

- Cadastrar moradores e controlar sua categoria (Bixo/Agregado/Morador)
- Registrar despesas mensais por categoria
- Planejar orçamentos (avulsos ou a partir de modelos reutilizáveis) e aplicá-los como despesa real
- Calcular automaticamente quanto cada morador deve pagar, com fator proporcional para quem entrou/saiu no meio do mês
- Registrar pagamentos e acompanhar adimplência
- Gerar relatórios consolidados do mês

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Autenticação | JWT (`jose`) + hash de senha com argon2 |
| Banco de dados | MongoDB 7.0 |
| Infraestrutura | Docker + Docker Compose |
| Testes | Vitest (backend e frontend) + GitHub Actions (CI) |

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
curl http://localhost:3001/api/auth/login -X POST -H "Content-Type: application/json" -d '{"identifier":"x","password":"x"}'
# Esperado: {"error":"Credenciais inválidas"} — API respondendo (401, não erro de conexão)
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

## Publicar para uso por link

Para uma pessoa leiga usar, o ideal é publicar o app completo e enviar apenas a URL. O backend agora também consegue servir o frontend compilado em produção, então dá para hospedar tudo como uma aplicação web única com MongoDB gerenciado.

Veja o passo a passo em [docs/publicar-para-leigos.md](docs/publicar-para-leigos.md).

---

## Rodar os testes

Backend (`backend/tests/`) e frontend (`frontend/tests/`) usam Vitest. Nenhum dos dois precisa de banco de dados rodando — tudo é mockado (ver [docs/testes.md](docs/testes.md) para a estratégia completa).

```bash
cd backend   # ou cd frontend

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

O CI (`.github/workflows/ci.yml`) roda typecheck + testes com cobertura + build para os dois lados em todo push/PR para `main`.

---

## Endpoints da API

Base URL: `http://localhost:3001/api`. Referência completa (payloads, respostas, códigos de erro) em [docs/api.md](docs/api.md) — resumo abaixo. 🔒 = exige `Authorization: Bearer <token>` (ver [docs/autenticacao-e-autorizacao.md](docs/autenticacao-e-autorizacao.md)).

### Auth
```
POST   /auth/register          Cria conta admin + república nova
POST   /auth/login             Login por nickname
POST   /auth/logout
GET    /auth/me                🔒
POST   /auth/change-password   🔒
```

### Moradores
```
GET    /residents              🔒 Lista moradores (paginado, com ?search= por nome/apelido)
POST   /residents              🔒 admin — Cria morador
PUT    /residents/:id          🔒 Atualiza morador (o próprio ou admin)
```
> Não há `DELETE` — ver [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md).

### Despesas
```
GET    /expenses               🔒 Lista com filtros: ?category=&minAmount=&maxAmount=&search=&startDate=&endDate=
GET    /expenses/:id           🔒 Busca por ID
POST   /expenses               🔒 Cria despesa
PUT    /expenses/:id           🔒 Atualiza despesa
DELETE /expenses/:id           🔒 Remove despesa
POST   /expenses/:id/proof     🔒 Envia/substitui o comprovante (PDF ou imagem, multipart/form-data)
GET    /expenses/:id/proof     🔒 Baixa o arquivo do comprovante
DELETE /expenses/:id/proof     🔒 Remove o comprovante
```

### Categorias
```
GET    /categories             🔒 Lista categorias da república
POST   /categories             🔒 admin — Cria categoria
DELETE /categories/:id         🔒 admin — Remove categoria
```

### Orçamentos
```
GET    /budgets/templates              🔒 Modelos reutilizáveis
POST   /budgets/templates              🔒 admin — Cria modelo
DELETE /budgets/templates/:id          🔒 admin — Remove modelo
GET    /budgets/:year/:month           🔒 Orçamentos planejados do mês
POST   /budgets/:year/:month           🔒 admin — Cria orçamento avulso direto no mês
POST   /budgets/simulate/:year/:month  🔒 admin — Instancia os modelos como orçamento do mês
POST   /budgets/:id/apply              🔒 admin — Converte orçamento em despesa real
PUT    /budgets/:id                    🔒 admin — Ajusta valor
DELETE /budgets/:id                    🔒 admin — Remove
```

### Pagamentos
```
GET    /payments?month=YYYY-MM              Lista pagamentos do mês
GET    /payments?month=YYYY-MM&residentId=  Pagamentos de um morador
POST   /payments                            Registra pagamento
DELETE /payments/:id                        Remove pagamento
```
> Sem 🔒 — gap conhecido, ver [docs/andamento.md](docs/andamento.md).

### Fechamento Mensal
```
GET    /monthly-balance/:year/:month                           🔒 Painel do mês (saldo de todos)
PUT    /monthly-balance/:year/:month/:residentId/status         🔒 admin — Ativa/inativa no mês
PUT    /monthly-balance/:year/:month/:residentId/proportional   🔒 admin — Define dia de saída
DELETE /monthly-balance/:year/:month/:residentId/proportional   🔒 admin — Remove cálculo proporcional
POST   /monthly-balance/:year/:month/:residentId/payment        🔒 admin — Registra pagamento
DELETE /monthly-balance/payment/:paymentId                      🔒 admin — Remove pagamento
```

### Relatórios
```
GET    /reports/monthly?year=&month=    Relatório consolidado do mês
```
> Sem 🔒 — mesmo gap de `payments`.

---

## Variáveis de ambiente

O arquivo `.env.example` documenta todas as variáveis necessárias:

| Variável | Descrição | Padrão (dev) |
|----------|-----------|--------------|
| `MONGODB_URI` | String de conexão com o MongoDB | `mongodb://admin:password@mongodb:27017/caixinha?authSource=admin` |
| `PORT` | Porta do backend | `3001` |
| `CORS_ORIGIN` | Origem permitida pelo CORS do backend | `http://localhost:5173` |
| `VITE_API_URL` | URL da API consumida pelo frontend | `http://localhost:3001` |
| `JWT_SECRET` | Segredo para assinar os JWTs (gerar com `openssl rand -hex 32`) | — |
| `JWT_EXPIRES_IN` | Expiração do access token | `8h` |

---

## Documentação

Documentação detalhada em [docs/](docs/):

| Documento | Conteúdo |
|-----------|----------|
| [architecture.md](docs/architecture.md) | Estrutura de pastas, camadas do backend, frontend, multi-tenancy e fluxo funcional completo |
| [api.md](docs/api.md) | Referência completa de todos os endpoints |
| [autenticacao-e-autorizacao.md](docs/autenticacao-e-autorizacao.md) | Fluxo JWT, RBAC e matriz de permissões |
| [modelo-de-dados.md](docs/modelo-de-dados.md) | Entidades e a fórmula de cálculo da cota mensal |
| [decisoes-tecnicas.md](docs/decisoes-tecnicas.md) | ADRs — o porquê de cada escolha de arquitetura |
| [historias-de-usuario.md](docs/historias-de-usuario.md) | Histórias de usuário do projeto e status de implementação |
| [contribuicao.md](docs/contribuicao.md) | Convenções de branch/commit e checklist de PR |
| [testes.md](docs/testes.md) | Estratégia de testes automatizados |
| [andamento.md](docs/andamento.md) | Progresso por sprint |

---

## Equipe

Projeto desenvolvido na disciplina de Engenharia de Software:

- Alejandro Martins de Freitas
- Bianca Barreto Leme
- Karina Miyu Kinukawa
- Luiz Miguel Wojtyla Abreu Siqueira
- Matheus Rodrigues Pereira de Souza