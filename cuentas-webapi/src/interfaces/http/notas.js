// Adapter HTTP del recurso notas (D3/D7/D11).
//
// Solo orquesta: valida la FORMA del input (JSON, Content-Type, id numérico →
// 400), llama a commands/queries y traduce errores de dominio. Las reglas de
// negocio las valida el dominio.

import { readJson, responderJson, responderError } from './http.js';
import {
  CrearNota,
  ActualizarNota,
  EliminarNota,
} from '../../application/notas/commands.js';
import { ListarNotas, ObtenerNotaPorId } from '../../application/notas/queries.js';
import { CampoInvalidoError } from '../../domain/errores.js';

// El adapter valida la forma: id de la ruta debe ser un entero positivo.
function extraerId(params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new CampoInvalidoError(`id inválido: ${params.id}`);
  }
  return id;
}

export function registrarRutasNotas(router, deps) {
  // GET /notas → 200 + notas activas.
  router.anadir('/notas', 'GET', async (req, res) => {
    const notas = await ListarNotas(deps);
    responderJson(res, 200, notas.map((nota) => nota.aReadModel()));
  });

  // POST /notas → 201 + { id } | 404 (cuenta inexistente) | 400.
  router.anadir('/notas', 'POST', async (req, res) => {
    let cuerpo;
    try {
      cuerpo = await readJson(req);
    } catch (err) {
      responderError(res, err.status, err.error);
      return;
    }
    const { id } = await CrearNota(cuerpo, deps);
    responderJson(res, 201, { id });
  });

  // GET /notas/{id} → 200 + nota | 404.
  router.anadir('/notas/{id}', 'GET', async (req, res, params) => {
    const nota = await ObtenerNotaPorId({ id: extraerId(params) }, deps);
    responderJson(res, 200, nota.aReadModel());
  });

  // PUT /notas/{id} → 200 + nota | 404 | 400.
  router.anadir('/notas/{id}', 'PUT', async (req, res, params) => {
    let cuerpo;
    try {
      cuerpo = await readJson(req);
    } catch (err) {
      responderError(res, err.status, err.error);
      return;
    }
    const nota = await ActualizarNota(
      { id: extraerId(params), cuerpo },
      deps
    );
    responderJson(res, 200, nota.aReadModel());
  });

  // DELETE /notas/{id} → 204 (eliminación lógica) | 404.
  router.anadir('/notas/{id}', 'DELETE', async (req, res, params) => {
    await EliminarNota({ id: extraerId(params) }, deps);
    responderJson(res, 204);
  });
}
