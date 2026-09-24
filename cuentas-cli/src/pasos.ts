// Los 7 pasos del flujo (T6) — cada uno verifica estado HTTP + condición del
// cuerpo contra los read-models reales de la API y devuelve esperado vs real.
//
// Valores reutilizados de cuentas-webapi/docs/http/cuentas.http y notas.http
// (mismos datos que la DoD manual).

import { peticion } from './cliente-api.js';
import type {
  ContextoFlujo,
  Nota,
  ResultadoPaso,
  RespuestaApi,
} from './tipos.js';

export interface Paso {
  numero: number;
  nombre: string;
  metodo: string;
  ruta: string | ((ctx: ContextoFlujo) => string);
  ejecutar: (ctx: ContextoFlujo, api: string) => Promise<VerificacionPaso>;
  capturar?: (ctx: ContextoFlujo, res: RespuestaApi) => void;
}

// Resultado de ejecutar un paso: la última respuesta + su verificación
// (los pasos 6 y 7 encadenan DELETE + GET y reportan ambas condiciones).
export interface VerificacionPaso {
  res: RespuestaApi;
  resultado: ResultadoPaso;
}

// Valores del flujo (reutilizados de los .http de la API).
const DESCRIPCION_CUENTA = 'Cuenta de ahorro';
const NOTA_CREDITO = { tipo: 'credito', monto: 150.75, descripcion: 'Pago de cliente' } as const;
const NOTA_MONTO_INVALIDO = { tipo: 'credito', monto: 0, descripcion: 'Monto no positivo' } as const;
const NOTA_DEBITO = { tipo: 'debito', monto: 80, descripcion: 'Pago de cliente actualizado' } as const;

export const TOTAL_PASOS = 7;

type Cuerpo = Record<string, unknown>;

const esObjeto = (valor: unknown): valor is Cuerpo =>
  typeof valor === 'object' && valor !== null;

function verificarRes(
  res: RespuestaApi,
  esperado: number,
  verificarCuerpo?: (cuerpo: unknown) => string | undefined
): ResultadoPaso {
  const falloEstado = res.estado !== esperado;
  const detalleCuerpo = !falloEstado && verificarCuerpo ? verificarCuerpo(res.cuerpo) : undefined;
  if (!falloEstado && !detalleCuerpo) {
    return { exitoso: true, esperado: `estado ${esperado}`, real: `estado ${res.estado}` };
  }
  const esperadoTexto = `estado ${esperado}${verificarCuerpo ? ' + cuerpo válido' : ''}`;
  const realTexto = falloEstado
    ? `estado ${res.estado} + cuerpo ${JSON.stringify(res.cuerpo)}`
    : `estado ${res.estado} + ${detalleCuerpo}`;
  return { exitoso: false, esperado: esperadoTexto, real: realTexto };
}

// Verificación en dos peticiones: DELETE → 204 y luego GET → 404 (elim. lógica).
async function verificarEliminacion(
  api: string,
  metodo: string,
  rutaEliminar: string,
  rutaConsultar: string
): Promise<VerificacionPaso> {
  const resDelete = await peticion(api, metodo, rutaEliminar);
  const base = verificarRes(resDelete, 204);
  if (!base.exitoso) return { res: resDelete, resultado: base };
  const resGet = await peticion(api, 'GET', rutaConsultar);
  const res = verificarRes(resGet, 404);
  const resultado: ResultadoPaso = res.exitoso
    ? { exitoso: true, esperado: `estado 204 + estado 404`, real: `estado 204 + estado 404` }
    : { exitoso: false, esperado: `estado 204 + estado 404`, real: `estado 204 + ${res.real}` };
  return { res: resGet, resultado };
}

const idNumerico = (cuerpo: unknown): string | undefined => {
  const id = esObjeto(cuerpo) ? cuerpo.id : undefined;
  return typeof id === 'number' ? undefined : `id no numérico en ${JSON.stringify(cuerpo)}`;
};

export const PASOS: Paso[] = [
  {
    numero: 1,
    nombre: 'Crear cuenta',
    metodo: 'POST',
    ruta: '/cuentas',
    async ejecutar(_ctx, api) {
      const res = await peticion(api, 'POST', '/cuentas', { descripcion: DESCRIPCION_CUENTA });
      return { res, resultado: verificarRes(res, 201, idNumerico) };
    },
    capturar: (ctx, res) => {
      if (esObjeto(res.cuerpo) && typeof res.cuerpo.id === 'number') {
        ctx.cuentaId = res.cuerpo.id;
      }
    },
  },
  {
    numero: 2,
    nombre: 'Consultar cuenta',
    metodo: 'GET',
    ruta: (ctx) => `/cuentas/${ctx.cuentaId}`,
    async ejecutar(ctx, api) {
      const res = await peticion(api, 'GET', `/cuentas/${ctx.cuentaId}`);
      const resultado = verificarRes(res, 200, (cuerpo) => {
        if (!esObjeto(cuerpo)) return `cuerpo inesperado ${JSON.stringify(cuerpo)}`;
        if (cuerpo.id !== ctx.cuentaId)
          return `id ${String(cuerpo.id)} ≠ ${String(ctx.cuentaId)}`;
        if (cuerpo.descripcion !== DESCRIPCION_CUENTA)
          return `descripcion "${String(cuerpo.descripcion)}" ≠ "${DESCRIPCION_CUENTA}"`;
        return undefined;
      });
      return { res, resultado };
    },
  },
  {
    numero: 3,
    nombre: 'Registrar nota de crédito',
    metodo: 'POST',
    ruta: '/notas',
    async ejecutar(ctx, api) {
      const res = await peticion(api, 'POST', '/notas', {
        cuentaId: ctx.cuentaId,
        ...NOTA_CREDITO,
      });
      return { res, resultado: verificarRes(res, 201, idNumerico) };
    },
    capturar: (ctx, res) => {
      if (esObjeto(res.cuerpo) && typeof res.cuerpo.id === 'number') {
        ctx.notaId = res.cuerpo.id;
      }
    },
  },
  {
    numero: 4,
    nombre: 'Rechazo por monto inválido (0)',
    metodo: 'POST',
    ruta: '/notas',
    async ejecutar(ctx, api) {
      // El rechazo ES el comportamiento esperado: 400 + { "error": ... }.
      const res = await peticion(api, 'POST', '/notas', {
        cuentaId: ctx.cuentaId,
        ...NOTA_MONTO_INVALIDO,
      });
      const resultado = verificarRes(res, 400, (cuerpo) => {
        if (!esObjeto(cuerpo) || typeof cuerpo.error !== 'string' || cuerpo.error === '')
          return `falta el campo error en ${JSON.stringify(cuerpo)}`;
        return undefined;
      });
      return { res, resultado };
    },
  },
  {
    numero: 5,
    nombre: 'Actualizar nota a débito',
    metodo: 'PUT',
    ruta: (ctx) => `/notas/${ctx.notaId}`,
    async ejecutar(ctx, api) {
      // Fail fast: si el flujo llegó aquí, los pasos 1 y 3 ya capturaron los ids.
      const notaId = ctx.notaId as number;
      const cuentaId = ctx.cuentaId as number;
      const res = await peticion(api, 'PUT', `/notas/${notaId}`, {
        cuentaId,
        ...NOTA_DEBITO,
      });
      const resultado = verificarRes(res, 200, (cuerpo) => {
        if (!esObjeto(cuerpo)) return `cuerpo inesperado ${JSON.stringify(cuerpo)}`;
        const esperado: Nota = { id: notaId, cuentaId, ...NOTA_DEBITO };
        for (const [campo, valor] of Object.entries(esperado)) {
          if (cuerpo[campo] !== valor)
            return `${campo} ${JSON.stringify(cuerpo[campo])} ≠ ${JSON.stringify(valor)}`;
        }
        return undefined;
      });
      return { res, resultado };
    },
  },
  {
    numero: 6,
    nombre: 'Eliminar nota lógica',
    metodo: 'DELETE',
    ruta: (ctx) => `/notas/${ctx.notaId}`,
    async ejecutar(ctx, api) {
      return verificarEliminacion(api, 'DELETE', `/notas/${ctx.notaId}`, `/notas/${ctx.notaId}`);
    },
  },
  {
    numero: 7,
    nombre: 'Eliminar cuenta lógica',
    metodo: 'DELETE',
    ruta: (ctx) => `/cuentas/${ctx.cuentaId}`,
    async ejecutar(ctx, api) {
      return verificarEliminacion(
        api,
        'DELETE',
        `/cuentas/${ctx.cuentaId}`,
        `/cuentas/${ctx.cuentaId}`
      );
    },
  },
];
