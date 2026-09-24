// Queries CQRS — lecturas del recurso notas (D10).
//
// DI manual: el repositorio (puerto) entra por parámetro. Solo conoce domain/.

import { NotaNoEncontradaError } from '../../domain/errores.js';

// GET /notas → 200 + arreglo de notas activas.
export async function ListarNotas({ notaRepository }) {
  return notaRepository.findAllActivas();
}

// GET /notas/{id} → 200 + nota. 404 si no existe / está eliminada.
export async function ObtenerNotaPorId({ id }, { notaRepository }) {
  const nota = await notaRepository.findByIdActiva(id);
  if (!nota) throw new NotaNoEncontradaError(`nota ${id} no existe o fue eliminada`);
  return nota;
}
