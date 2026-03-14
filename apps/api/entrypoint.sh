#!/bin/sh
set -e

echo "Running database migrations..."
node apps/api/dist/data-source.js migration:run 2>/dev/null || \
  npx typeorm migration:run -d apps/api/dist/data-source.js
echo "Migrations complete."

exec node apps/api/dist/main
