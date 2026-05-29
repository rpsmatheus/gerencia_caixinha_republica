FROM node:20-alpine

WORKDIR /app

# Copiar package.json e pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build TypeScript
RUN pnpm build

# Expor porta
EXPOSE 3001

# Comando padrão
CMD ["pnpm", "start"]
