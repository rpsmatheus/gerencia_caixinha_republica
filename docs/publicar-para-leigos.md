# Publicar para uma pessoa leiga usar

O app completo deve ser usado por link, no navegador. A pessoa que vai usar não precisa instalar Docker, Node.js, MongoDB ou abrir terminal.

## O que precisa ficar online

- Backend Node.js deste repositório.
- Frontend React compilado.
- Banco MongoDB gerenciado, por exemplo MongoDB Atlas.

Em produção, o backend também serve o frontend compilado. Assim dá para entregar uma URL só. No deploy grátis, comprovantes ficam desativados para não depender de disco persistente pago.

## Variáveis de ambiente do backend

Configure estas variáveis no serviço de hospedagem:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://USUARIO:SENHA@HOST/caixinha?retryWrites=true&w=majority
JWT_SECRET=gere-um-segredo-grande
JWT_EXPIRES_IN=8h
FRONTEND_DIST_PATH=../frontend/dist
ENABLE_PROOFS=false
```

Se frontend e backend ficarem em domínios separados, também configure:

```env
CORS_ORIGIN=https://dominio-do-frontend
VITE_API_URL=https://dominio-do-backend
```

Se o backend servir o frontend, não precisa configurar `VITE_API_URL`.

## Deploy pronto no Render

O repositório tem um [`render.yaml`](../render.yaml) e um [`Dockerfile.prod`](../Dockerfile.prod). No Render, crie um Blueprint a partir do repositório e informe apenas a variável `MONGODB_URI`.

O deploy cria:

- um serviço web grátis com frontend e backend juntos;
- `JWT_SECRET` gerado automaticamente;
- comprovantes desativados, evitando uso de disco persistente pago.

Se usar outra hospedagem Docker, use o mesmo `Dockerfile.prod` e configure as variáveis de ambiente de produção. Para reativar comprovantes futuramente, use armazenamento persistente e defina `ENABLE_PROOFS=true`.

## Build e start

Use estes comandos na hospedagem:

```bash
pnpm install
pnpm install-all
pnpm build:production
pnpm start
```

Depois de publicado, envie apenas a URL para a pessoa usar.

## Primeiro uso

1. A pessoa acessa o link.
2. Clica em `Registrar`.
3. Cria a conta da república.
4. Cadastra moradores, despesas e pagamentos.

Cada cadastro inicial cria uma república isolada das outras.
