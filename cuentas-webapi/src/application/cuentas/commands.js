// Commands CQRS — escrituras del recurso cuentas (D10).
//
// DI manual: el repositorio (puerto) entra por parámetro; no hay closures
// globales. Solo conoce domain/ y el puerto.

import { Cuenta } from '../../domain/cuenta.js';
import { CuentaNoEncontradaError } from '../../domain/errores.js';

// POST /cuentas → 201 + id generado.
export async function CrearCuenta({ descripcion }, repository) {
  const cuenta = Cuenta.crear({ descripcion });
  const id = await repository.insert(cuenta);
  return { id };
}

// PUT /cuentas/{id} → 200. 404 si la cuenta no existe / está eliminada.
export async function ActualizarCuenta({ id, descripcion }, repository) {
  const cuenta = await repository.findByIdActiva(id);
  if (!cuenta) throw new CuentaNoEncontradaError(`cuenta ${id} no existe o fue eliminada`);
  cuenta.actualizarDescripcion(descripcion);
  await repository.update(cuenta);
  return cuenta;
}

// DELETE /cuentas/{id} → 204. Eliminación lógica (UPDATE estado = 0).
export async function EliminarCuenta({ id }, repository) {
  const cuenta = await repository.findByIdActiva(id);
  if (!cuenta) throw new CuentaNoEncontradaError(`cuenta ${id} no existe o fue eliminada`);
  await repository.eliminarLogico(id);
}
