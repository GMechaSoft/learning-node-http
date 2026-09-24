// Config del CLI (T3) — URL base de la API por env con default.
//
// Patrón del GPS de la API (D4): valores por env con default; nunca hardcodear
// más que el default local.
import process from 'node:process';

const DEFAULT_BASE_URL = 'http://localhost:3000';


export function obtenerBaseUrl(): string {
  return process.env.CUENTAS_API_BASE ?? DEFAULT_BASE_URL;
}
