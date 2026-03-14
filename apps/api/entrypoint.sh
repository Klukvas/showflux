#!/bin/sh
set -e

echo "Running database migrations..."
npx typeorm migration:run -d apps/api/dist/data-source.js
echo "Migrations complete."

exec node apps/api/dist/main
