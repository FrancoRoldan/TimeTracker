// Plantilla canónica. El Dockerfile del frontend reemplaza los PLACEHOLDER en
// build-time con los valores de los ARG correspondientes.
export const environment = {
    baseUrl: "API_URL_PLACEHOLDER",

    // Identidad del despliegue (§29 del plan de observabilidad).
    appVersion: "APP_VERSION_PLACEHOLDER",
    envName: "ENV_NAME_PLACEHOLDER",

    // Telemetría del frontend (§17 y §18).
    telemetry: {
        enabled: true,
        // Vacío = se deriva de baseUrl, apuntando a POST {baseUrl}/telemetry.
        endpoint: "",
        // Fracción de sesiones que reportan Web Vitals y eventos de uso.
        // Los errores se envían siempre, sin muestreo.
        sampleRate: 1.0
    }
};
