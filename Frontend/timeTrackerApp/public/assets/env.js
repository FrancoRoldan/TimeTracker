// Config de runtime para producción. En Docker, docker-entrypoint.sh regenera
// este archivo al arrancar el contenedor a partir de variables de entorno
// (API_URL, APP_VERSION, ENV_NAME) - así la misma imagen sirve para cualquier
// entorno sin rebuildear. Estos valores son solo el fallback si el contenedor
// no llega a ejecutar el entrypoint (ej. build estático sin Docker).
window.__env = {
  apiUrl: "http://localhost:5083/api",
  appVersion: "unknown",
  envName: "Production"
};
