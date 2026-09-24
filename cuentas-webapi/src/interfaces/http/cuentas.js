// Adapter HTTP del recurso cuentas (D3/D7/D11).
//
// Solo orquesta: valida la FORMA del input (JSON, Content-Type, id numérico →
// 400), llama a commands/queries y traduce errores de dominio. Las reglas de
// negocio las valida el dominio.

import { readJson, responderJson, responderError } from './http.js';
import {
  CrearCuenta,
  ActualizarCuenta,
  EliminarCuenta,
} from '../../application/cuentas/commands.js';
import { ListarCuentas, ObtenerCuentaPorId } from '../../application/cuentas/queries.js';
import { CampoInvalidoError } from '../../domain/errores.js';

// El adapter valida la forma: id de la ruta debe ser un entero positivo.
function extraerId(params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new CampoInvalidoError(`id inválido: ${params.id}`);
  }
  return id;
}

export function registrarRutasCuentas(router, { repository }) {
  // GET /cuentas → 200 + cuentas activas.
  router.anadir('/cuentas', 'GET', async (req, res) => {
    const cuentas = await ListarCuentas(repository);
    responderJson(res, 200, cuentas.map((cuenta) => cuenta.aReadModel()));
  });

  // POST /cuentas → 201 + { id }.
  router.anadir('/cuentas', 'POST', async (req, res) => {
    let cuerpo;
    try {
      cuerpo = await readJson(req);
    } catch (err) {
      responderError(res, err.status, err.error);
      return;
    }
    const { id } = await CrearCuenta(cuerpo, repository);
    responderJson(res, 201, { id });
  });

  // GET /cuentas/{id} → 200 + cuenta | 404.
  router.anadir('/cuentas/{id}', 'GET', async (req, res, params) => {
    const cuenta = await ObtenerCuentaPorId({ id: extraerId(params) }, repository);
    responderJson(res, 200, cuenta.aReadModel());
  });

  // PUT /cuentas/{id} → 200 + cuenta | 404 | 400.
  router.anadir('/cuentas/{id}', 'PUT', async (req, res, params) => {
    let cuerpo;
    try {
      cuerpo = await readJson(req);
    } catch (err) {
      responderError(res, err.status, err.error);
      return;
    }
    const cuenta = await ActualizarCuenta(
      { id: extraerId(params), descripcion: cuerpo.descripcion },
      repository
    );
    responderJson(res, 200, cuenta.aReadModel());
  });

  // DELETE /cuentas/{id} → 204 (eliminación lógica) | 404.
  router.anadir('/cuentas/{id}', 'DELETE', async (req, res, params) => {
    await EliminarCuenta({ id: extraerId(params) }, repository);
    responderJson(res, 204);
  });
}
