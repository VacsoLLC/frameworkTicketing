#!/usr/bin/env bash
set -euo pipefail
cd /workspaces

sudo chown node:node \
  /workspaces/frameworkBackend/node_modules \
  /workspaces/frameworkFrontend/node_modules \
  /workspaces/frameworkTicketing/node_modules \
  /workspaces/frameworkTicketing/backend/node_modules \
  /workspaces/frameworkTicketing/frontend/node_modules \
  /home/node/.cache \
  /home/node/.claude

if [ ! -f frameworkTicketing/backend/.env ]; then
  (cd frameworkTicketing/backend && bash ./generate_env.sh)
  sed -i 's|^DOMAIN_NAME=.*|DOMAIN_NAME=localhost|' frameworkTicketing/backend/.env
  sed -i 's|^NODE_ENV=.*|NODE_ENV=development|' frameworkTicketing/backend/.env
  echo "MARIADB_HOST=mariadb" >> frameworkTicketing/backend/.env
  echo "MARQO_HOST=marqo" >> frameworkTicketing/backend/.env
fi

(cd frameworkBackend  && yarn install && yarn link)
(cd frameworkFrontend && yarn install && yarn link)
(cd frameworkTicketing/backend  && yarn install && yarn link @vacso/frameworkbackend)
(cd frameworkTicketing/frontend && yarn install && yarn link @vacso/frameworkfrontend)
(cd frameworkTicketing && yarn install)

echo "Bootstrap complete. Open the workspace: File > Open Workspace from File > frameworkTicketing.code-workspace"
