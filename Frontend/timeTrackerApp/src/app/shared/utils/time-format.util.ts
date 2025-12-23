/**
 * Convierte minutos a formato legible "Xh Ym"
 * @param minutes Total de minutos
 * @returns String formateado como "2h 30m" o "45m"
 */
export function formatMinutesToHoursAndMinutes(minutes: number): string {
  if (!minutes || minutes === 0) {
    return '0m';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Convierte minutos a horas decimales (para cálculos)
 * @param minutes Total de minutos
 * @returns Horas en formato decimal
 */
export function minutesToDecimalHours(minutes: number): number {
  return minutes / 60;
}
