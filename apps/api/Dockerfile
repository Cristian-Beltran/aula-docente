FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY apps/api/src ./apps/api/src

RUN pnpm --filter api build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile --prod --filter api

COPY --from=builder /app/apps/api/dist ./dist

COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
