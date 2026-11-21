#!/bin/sh
set -e
# Apply any pending migrations.
(cd migrate && ./node_modules/.bin/prisma migrate deploy --config prisma7.config.ts)

# Public demo deployments: reset the demo business on every start.
if [ "$SEED_DEMO" = "true" ]; then
  node seed.mjs || echo "Demo seed failed; starting anyway"
fi

exec node server.js
