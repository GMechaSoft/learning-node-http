// Commands CQRS — escrituras del recurso notas (D10).
//
// DI manual: los puertos (notaRepository, cuentaRepository) entran por
// parámetro; no hay closures globales. Solo conoce domain/ y los puertos.
//
// Regla de negocio (AC 3): una nota siempre pertenece a una cuenta EXISTENTE
// y activa — se valida contra el puerto CuentaRepository.

import { Nota } from '../../domain/nota.js';
import { NotaNoEncontradaError, CuentaNoEncontradaError } from '../../domain/errores.js';

// Valida que la cuenta de referencia exista y esté activa → 404 si no.
async function validarCuentaActiva(cuentaId, cuentaRepository) {
  const cuenta = await cuentaRepository.findByIdActiva(cuentaId);
  if (!cuenta) throw new CuentaNoEncontradaError(`cuenta ${cuentaId} no existe o fue eliminada`);
}

// POST /notas → 201 + id generado. 404 si la cuenta no existe / está eliminada.
// La nota se valida ANTES de la regla de cuenta: campos mal formados → 400
// sin tocar la BD (y una cuentaId no numérica no llega al repositorio).
export async function CrearNota(cuerpo, { notaRepository, cuentaRepository }) {
  const nota = Nota.crear(cuerpo);
  await validarCuentaActiva(cuerpo.cuentaId, cuentaRepository);
  const id = await notaRepository.insert(nota);
  return { id };
}

// PUT /notas/{id} → 200. 404 si la nota no existe / está eliminada, o si la
// cuenta de referencia (cuando cambia) no existe / está eliminada.
export async function ActualizarNota({ id, cuerpo }, { notaRepository, cuentaRepository }) {
  const nota = await notaRepository.findByIdActiva(id);
  if (!nota) throw new NotaNoEncontradaError(`nota ${id} no existe o fue eliminada`);
  // cuentaId se valida antes de compararla: una cuentaId mal formada no
  // debe llegar al repositorio de cuentas (500) — CampoInvalidoError (400).
  if (cuerpo.cuentaId !== undefined) Nota._validarCuentaId(cuerpo.cuentaId);
  if (cuerpo.cuentaId !== undefined && cuerpo.cuentaId !== nota.cuentaId) {
    await validarCuentaActiva(cuerpo.cuentaId, cuentaRepository);
  }
  nota.actualizar(cuerpo);
  await notaRepository.update(nota);
  return nota;
}

// DELETE /notas/{id} → 204. Eliminación lógica (UPDATE estado = 0).
export async function EliminarNota({ id }, { notaRepository }) {
  const nota = await notaRepository.findByIdActiva(id);
  if (!nota) throw new NotaNoEncontradaError(`nota ${id} no existe o fue eliminada`);
  await notaRepository.eliminarLogico(id);
}
