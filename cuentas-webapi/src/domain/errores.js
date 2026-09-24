// Errores de dominio tipados (D11).
//
// El dominio lanza estos errores; el adapter HTTP (interfaces/) los traduce a
// códigos (400/404/500). El dominio NUNCA conoce HTTP ni mssql.

export class ErrorDominio extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = new.target.name;
  }
}

// Campo del input ausente o inválido (regla de negocio) → 400.
export class CampoInvalidoError extends ErrorDominio {}

// Recurso no existe o fue eliminado lógicamente (estado = 0) → 404.
export class CuentaNoEncontradaError extends ErrorDominio {}
