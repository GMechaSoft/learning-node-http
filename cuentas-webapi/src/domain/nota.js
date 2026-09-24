// Entidad Nota (DDD) — invariantes: tipo ∈ {debito, credito}, monto > 0,
// descripción no vacía (D11).
//
// El dominio no importa node:http, mssql ni nada de interfaces//data/.

import { CampoInvalidoError } from './errores.js';

const TIPOS = new Set(['debito', 'credito']);

export class Nota {
  constructor({ id, cuentaId, tipo, monto, descripcion, estado }) {
    this.id = id;
    this.cuentaId = cuentaId;
    this.tipo = tipo;
    this.monto = monto;
    this.descripcion = descripcion;
    this.estado = estado;
  }

  // Fábrica de creación nueva: valida los invariantes.
  static crear({ cuentaId, tipo, monto, descripcion }) {
    return new Nota({
      id: null,
      cuentaId: Nota._validarCuentaId(cuentaId),
      tipo: Nota._validarTipo(tipo),
      monto: Nota._validarMonto(monto),
      descripcion: Nota._validarDescripcion(descripcion),
      estado: 1,
    });
  }

  // Reconstrucción desde la BD (la fila ya fue validada por el DDL).
  static reconstruir({ id, cuenta_id, tipo, monto, descripcion, estado }) {
    return new Nota({
      id,
      cuentaId: Number(cuenta_id),
      tipo,
      monto: Number(monto),
      descripcion,
      estado: estado === 1 || estado === true,
    });
  }

  // Cambio de datos: revalida los invariantes.
  actualizar({ cuentaId, tipo, monto, descripcion }) {
    this.cuentaId = Nota._validarCuentaId(cuentaId);
    this.tipo = Nota._validarTipo(tipo);
    this.monto = Nota._validarMonto(monto);
    this.descripcion = Nota._validarDescripcion(descripcion);
  }

  static _validarCuentaId(cuentaId) {
    if (!Number.isInteger(cuentaId) || cuentaId < 1) {
      throw new CampoInvalidoError('cuentaId debe ser un entero positivo');
    }
    return cuentaId;
  }

  static _validarTipo(tipo) {
    if (typeof tipo !== 'string' || !TIPOS.has(tipo)) {
      throw new CampoInvalidoError("tipo debe ser 'debito' o 'credito'");
    }
    return tipo;
  }

  static _validarMonto(monto) {
    if (typeof monto !== 'number' || !Number.isFinite(monto) || monto <= 0) {
      throw new CampoInvalidoError('monto debe ser numérico y mayor a 0');
    }
    return monto;
  }

  static _validarDescripcion(descripcion) {
    if (typeof descripcion !== 'string' || descripcion.trim() === '') {
      throw new CampoInvalidoError('descripcion es obligatoria y no puede estar vacía');
    }
    return descripcion.trim();
  }

  // Read model plano para responder (read-model directo).
  aReadModel() {
    return {
      id: this.id,
      cuentaId: this.cuentaId,
      tipo: this.tipo,
      monto: this.monto,
      descripcion: this.descripcion,
    };
  }
}
