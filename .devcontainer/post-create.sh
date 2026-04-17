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

# Docker-outside-of-docker: the bind-mounted /var/run/docker.sock is
# owned by a group whose GID matches the host's `docker` group, which
# rarely matches the one the Dockerfile created. Re-point the container's
# `docker` group to whatever GID the mounted socket exposes so the `node`
# user (already in the docker group) can talk to the daemon without sudo.
if [ -S /var/run/docker.sock ]; then
  SOCK_GID=$(stat -c %g /var/run/docker.sock)
  if [ "$SOCK_GID" -ne 0 ] && ! getent group "$SOCK_GID" >/dev/null; then
    sudo groupmod -g "$SOCK_GID" docker || true
  elif [ "$SOCK_GID" -ne 0 ]; then
    # A group already has this GID — just add node to it.
    sudo usermod -aG "$(getent group "$SOCK_GID" | cut -d: -f1)" node || true
  fi
fi

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
