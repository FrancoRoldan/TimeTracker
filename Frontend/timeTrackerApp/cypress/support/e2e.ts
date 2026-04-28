import './commands';

// Suppress uncaught errors that come from Angular zone (e.g. ResizeObserver)
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver loop') ||
    err.message.includes('Non-Error promise rejection')
  ) {
    return false;
  }
  return true;
});
