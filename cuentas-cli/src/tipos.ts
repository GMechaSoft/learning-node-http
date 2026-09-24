// Tipos del flujo (T4) — contratos alineados a los read-models de la API.
//
// Cuenta: { id, descripcion } · Nota: { id, cuentaId, tipo, monto, descripcion }
// POSTs responden 201 + { id }.

export type TipoNota = 'debito' | 'credito';

export interface Cuenta {
  id: number;
  descripcion: string;
}

export interface Nota {
  id: number;
  cuentaId: number;
  tipo: TipoNota;
  monto: number;
  descripcion: string;
}

export interface CuentaInput {
  descripcion: string;
}

export interface NotaInput {
  cuentaId: number;
  tipo: TipoNota;
  monto: number;
  descripcion: string;
}

export interface RespuestaApi {
  estado: number;
  cuerpo: unknown;
}

export interface ResultadoPaso {
  exitoso: boolean;
  esperado: string;
  real: string;
}

export interface ContextoFlujo {
  cuentaId?: number;
  notaId?: number;
}
