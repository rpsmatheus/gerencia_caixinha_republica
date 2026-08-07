FROM node:22-alpine AS build

WORKDIR /app

ENV CI=true

RUN npm install -g pnpm@11.8.0

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./frontend/
RUN cd frontend && pnpm install --frozen-lockfile
COPY frontend ./frontend
RUN cd frontend && pnpm build

COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./backend/
RUN cd backend && pnpm install --frozen-lockfile
COPY backend ./backend
RUN cd backend && pnpm build && pnpm prune --prod

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_DIST_PATH=/app/frontend/dist
ENV PROOF_UPLOAD_DIR=/app/uploads/expenses

COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/uploads/expenses

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/index.js"]
