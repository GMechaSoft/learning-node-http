// Repositorio MSSQL de notas — implementa el puerto
// application/notas/ports.js (D3).
//
// Solo datos: sin reglas de negocio (esas viven en domain/). El mapeo
// fila → entidad vive aquí (read-model directo).
// Eliminación lógica: UPDATE estado = 0; nunca DELETE SQL (D5/D8).

import sql from 'mssql';
import { Nota } from '../domain/nota.js';

export function crearNotaRepository(pool) {
  return {
    // INSERT y devuelve el id generado (INT IDENTITY — D6).
    async insert(nota) {
      const result = await pool
        .request()
        .input('cuenta_id', sql.Int, nota.cuentaId)
        .input('tipo', sql.NVarChar(10), nota.tipo)
        .input('monto', sql.Decimal(18, 2), nota.monto)
        .input('descripcion', sql.NVarChar(200), nota.descripcion)
        .query(
          'INSERT INTO notas (cuenta_id, tipo, monto, descripcion, estado) OUTPUT INSERTED.id VALUES (@cuenta_id, @tipo, @monto, @descripcion, 1);'
        );
      return result.recordset[0].id;
    },

    // Nota activa por id; null si no existe o fue eliminada lógicamente.
    async findByIdActiva(id) {
      const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query('SELECT id, cuenta_id, tipo, monto, descripcion, estado FROM notas WHERE id = @id AND estado = 1;');
      const fila = result.recordset[0];
      return fila ? Nota.reconstruir(fila) : null;
    },

    // Notas activas (estado = 1).
    async findAllActivas() {
      const result = await pool
        .request()
        .query('SELECT id, cuenta_id, tipo, monto, descripcion, estado FROM notas WHERE estado = 1 ORDER BY id;');
      return result.recordset.map((fila) => Nota.reconstruir(fila));
    },

    // Actualiza los datos de una nota activa.
    async update(nota) {
      await pool
        .request()
        .input('id', sql.Int, nota.id)
        .input('cuenta_id', sql.Int, nota.cuentaId)
        .input('tipo', sql.NVarChar(10), nota.tipo)
        .input('monto', sql.Decimal(18, 2), nota.monto)
        .input('descripcion', sql.NVarChar(200), nota.descripcion)
        .query(
          'UPDATE notas SET cuenta_id = @cuenta_id, tipo = @tipo, monto = @monto, descripcion = @descripcion WHERE id = @id AND estado = 1;'
        );
    },

    // Eliminación lógica (D5): estado → 0. La fila permanece en la BD.
    async eliminarLogico(id) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .query('UPDATE notas SET estado = 0 WHERE id = @id;');
    },
  };
}
