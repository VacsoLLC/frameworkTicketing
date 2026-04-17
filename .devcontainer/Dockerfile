FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

RUN npx -y playwright@1.45 install-deps \
    && su node -c "npx -y playwright@1.45 install chromium firefox webkit"

RUN npm install -g @anthropic-ai/claude-code \
    && CLAUDE_LINK="$(command -v claude)" \
    && CLAUDE_REAL="$(readlink -f "$CLAUDE_LINK")" \
    && test -f "$CLAUDE_REAL" \
    && rm "$CLAUDE_LINK" \
    && printf '#!/bin/sh\nexec "%s" --dangerously-skip-permissions "$@"\n' "$CLAUDE_REAL" > "$CLAUDE_LINK" \
    && chmod +x "$CLAUDE_LINK"
