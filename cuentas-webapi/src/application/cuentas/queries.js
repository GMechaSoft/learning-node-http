// Queries CQRS — lecturas del recurso cuentas (D10).
//
// DI manual: el repositorio (puerto) entra por parámetro. Solo conoce domain/.

import { CuentaNoEncontradaError } from '../../domain/errores.js';

// GET /cuentas → 200 + arreglo de cuentas activas.
export async function ListarCuentas(repository) {
  return repository.findAllActivas();
}

// GET /cuentas/{id} → 200 + cuenta. 404 si no existe / está eliminada.
export async function ObtenerCuentaPorId({ id }, repository) {
  const cuenta = await repository.findByIdActiva(id);
  if (!cuenta) throw new CuentaNoEncontradaError(`cuenta ${id} no existe o fue eliminada`);
  return cuenta;
}
