FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/api/package.json apps/api/tsconfig.json ./

RUN npm install

COPY apps/api/src ./src

RUN npx tsc -p tsconfig.json

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY apps/api/package.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
