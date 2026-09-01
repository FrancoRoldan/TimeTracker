#!/bin/sh
set -e

# Genera assets/env.js con las variables de entorno del contenedor. Corre en
# cada arranque, no en build-time: la misma imagen sirve para cualquier
# entorno con solo cambiar estas env vars (sin rebuildear).
ENV_JS_PATH=/usr/share/nginx/html/assets/env.js

cat > "$ENV_JS_PATH" <<EOF
window.__env = {
  apiUrl: "${API_URL:-http://localhost:5083/api}",
  appVersion: "${APP_VERSION:-unknown}",
  envName: "${ENV_NAME:-Production}"
};
EOF

exec "$@"
