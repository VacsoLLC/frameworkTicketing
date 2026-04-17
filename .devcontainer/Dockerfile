FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl default-mysql-client unzip gnupg lsb-release \
    && rm -rf /var/lib/apt/lists/*

RUN ARCH="$(uname -m)" \
    && case "$ARCH" in \
         x86_64)  AWS_ARCH=x86_64 ;; \
         aarch64) AWS_ARCH=aarch64 ;; \
         *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
       esac \
    && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${AWS_ARCH}.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip

RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends terraform \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI only (docker-outside-of-docker pattern). The daemon runs on
# the host; docker-compose.yml mounts /var/run/docker.sock into the
# container. post-create.sh aligns the `docker` group's GID with the
# mounted socket so the non-root `node` user can use docker without sudo.
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli docker-buildx-plugin docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -f docker \
    && usermod -aG docker node

RUN npx -y playwright@1.45 install-deps \
    && su node -c "npx -y playwright@1.45 install chromium firefox webkit"

RUN npm install -g @anthropic-ai/claude-code \
    && CLAUDE_LINK="$(command -v claude)" \
    && CLAUDE_REAL="$(readlink -f "$CLAUDE_LINK")" \
    && test -f "$CLAUDE_REAL" \
    && rm "$CLAUDE_LINK" \
    && printf '#!/bin/sh\nexec "%s" --dangerously-skip-permissions "$@"\n' "$CLAUDE_REAL" > "$CLAUDE_LINK" \
    && chmod +x "$CLAUDE_LINK"
