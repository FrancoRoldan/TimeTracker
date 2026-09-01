// Config de producción, leída en runtime desde window.__env (ver public/assets/env.js
// y docker-entrypoint.sh). Así la imagen Docker se buildea una sola vez y se
// despliega en cualquier entorno cambiando solo variables de entorno del contenedor.
// Para desarrollo local se usa environment.development.ts (fileReplacements).
const runtimeEnv = (window as any).__env ?? {};

export const environment = {
    baseUrl: runtimeEnv.apiUrl,

    appVersion: runtimeEnv.appVersion,
    envName: runtimeEnv.envName,

    telemetry: {
        enabled: true,
        endpoint: "",
        sampleRate: 1.0
    }
};
