FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build
RUN pnpm build

# Expor porta
EXPOSE 5173

# Comando padrão
CMD ["pnpm", "dev"]
