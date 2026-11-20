#!/bin/sh
set -e
# Apply any pending migrations, then start the server.
(cd migrate && ./node_modules/.bin/prisma migrate deploy --config prisma7.config.ts)
exec node server.js
