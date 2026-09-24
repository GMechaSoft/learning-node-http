// Entidad Cuenta (DDD) — invariante: descripción no vacía (D11).
//
// El dominio no importa node:http, mssql ni nada de interfaces//data/.

import { CampoInvalidoError } from './errores.js';

export class Cuenta {
  constructor({ id, descripcion, estado }) {
    this.id = id;
    this.descripcion = descripcion;
    this.estado = estado;
  }

  // Fábrica de creación nueva: valida el invariante.
  static crear({ descripcion }) {
    const normalizada = Cuenta._validarYNormalizar(descripcion);
    return new Cuenta({ id: null, descripcion: normalizada, estado: 1 });
  }

  // Reconstrucción desde la BD (la fila ya fue validada por el DDL).
  static reconstruir({ id, descripcion, estado }) {
    return new Cuenta({ id, descripcion, estado: estado === 1 || estado === true });
  }

  // Cambio de estado: revalida el invariante.
  actualizarDescripcion(descripcion) {
    this.descripcion = Cuenta._validarYNormalizar(descripcion);
  }

  static _validarYNormalizar(descripcion) {
    if (typeof descripcion !== 'string' || descripcion.trim() === '') {
      throw new CampoInvalidoError('descripcion es obligatoria y no puede estar vacía');
    }
    return descripcion.trim();
  }

  // Read model plano para responder (read-model directo).
  aReadModel() {
    return { id: this.id, descripcion: this.descripcion };
  }
}
