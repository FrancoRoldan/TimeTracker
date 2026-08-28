import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Puertos reales de la aplicación: 4200 el frontend (ng serve / contenedor)
    // y 5083 la API. Antes apuntaban a 3000/3001, que no corresponden a ningún
    // servicio del proyecto (hallazgo A16), así que la suite no podía usarse
    // como verificación sintética.
    // Se pueden sobrescribir con CYPRESS_BASE_URL y CYPRESS_apiUrl.
    baseUrl: process.env['CYPRESS_BASE_URL'] ?? 'http://localhost:4200',
    env: {
      // Sin el sufijo /api: los comandos de cypress/support/commands.ts ya lo concatenan.
      apiUrl: process.env['CYPRESS_API_URL'] ?? 'http://localhost:5083',
    },
    setupNodeEvents(_on, _config) {},
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    experimentalSessionAndOrigin: false,
  },
});
