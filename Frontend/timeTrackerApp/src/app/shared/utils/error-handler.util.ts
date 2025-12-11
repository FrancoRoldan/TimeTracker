import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts error message from HTTP error response
 * Handles different error response formats from the API
 */
export function extractErrorMessage(error: HttpErrorResponse | any, defaultMessage: string = 'Ha ocurrido un error. Por favor, intente nuevamente.'): string {
  // If error is a string, return it directly
  if (typeof error === 'string') {
    return error;
  }

  // If error is HttpErrorResponse
  if (error instanceof HttpErrorResponse) {
    // Check if error.error is a string (common format)
    if (typeof error.error === 'string') {
      return error.error;
    }

    // Check if error.error has an 'error' property
    if (error.error?.error) {
      return error.error.error;
    }

    // Check if error.error has a 'message' property
    if (error.error?.message) {
      return error.error.message;
    }

    // Check if error.error has a 'title' property
    if (error.error?.title) {
      return error.error.title;
    }

    // Check for validation errors (ASP.NET Core format)
    if (error.error?.errors) {
      const errors = error.error.errors;
      const errorMessages = Object.keys(errors).map(key => {
        const messages = errors[key];
        return Array.isArray(messages) ? messages.join(', ') : messages;
      });
      return errorMessages.join('. ');
    }

    // If status is 0, it's likely a network error
    if (error.status === 0) {
      return 'Error de conexión. Verifique su conexión a internet.';
    }

    // If status is 401, it's unauthorized
    if (error.status === 401) {
      return 'No autorizado. Por favor, inicie sesión nuevamente.';
    }

    // If status is 403, it's forbidden
    if (error.status === 403) {
      return 'No tiene permisos para realizar esta acción.';
    }

    // If status is 404, it's not found
    if (error.status === 404) {
      return 'Recurso no encontrado.';
    }

    // If status is 500, it's internal server error
    if (error.status === 500) {
      return error.error || error.message || 'Error interno del servidor.';
    }
  }

  // If error has a message property
  if (error?.message) {
    return error.message;
  }

  // Return default message
  return defaultMessage;
}
