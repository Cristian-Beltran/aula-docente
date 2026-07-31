FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/

RUN pnpm install --frozen-lockfile

COPY apps/api/src ./apps/api/src

WORKDIR /app/apps/api
RUN pnpm build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@9

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist

COPY apps/api/entrypoint.sh ./apps/api/
RUN chmod +x ./apps/api/entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["./entrypoint.sh"]
