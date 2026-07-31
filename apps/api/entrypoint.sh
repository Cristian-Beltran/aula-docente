#!/bin/sh
set -e

echo "=== Aula Docente API - Starting ==="
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_HOST: $DATABASE_HOST"
echo "PORT: $PORT"

echo ""
echo "=== Running database migrations ==="
node ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js

echo ""
echo "=== Seeding admin user ==="
node ./dist/database/seeds/admin.seed.js || echo "Admin seed completed or skipped"

echo ""
echo "=== Starting application ==="
exec node dist/main.js
