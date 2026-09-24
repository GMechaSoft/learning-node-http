// Traducción de errores → HTTP (D7/D11).
//
//   CuentaNoEncontradaError → 404 (no existe o eliminada lógicamente)
//   otros errores de dominio → 400 (validación)
//   cualquier otro           → 500 (imprevisto; sin detalles internos)

import { ErrorDominio, CuentaNoEncontradaError } from '../../domain/errores.js';
import { responderError } from './http.js';

export function responderErrorDominio(res, err) {
  if (err instanceof CuentaNoEncontradaError) {
    responderError(res, 404, err.message);
  } else if (err instanceof ErrorDominio) {
    responderError(res, 400, err.message);
  } else {
    responderError(res, 500, 'error interno del servidor');
  }
}
