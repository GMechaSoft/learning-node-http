// Repositorio MSSQL de cuentas — implementa el puerto
// application/cuentas/ports.js (D3).
//
// Solo datos: sin reglas de negocio (esas viven en domain/). El mapeo
// fila → entidad vive aquí (read-model directo).
// Eliminación lógica: UPDATE estado = 0; nunca DELETE SQL (D5/D8).

import sql from 'mssql';
import { Cuenta } from '../domain/cuenta.js';

export function crearCuentaRepository(pool) {
  return {
    // INSERT y devuelve el id generado (INT IDENTITY — D6).
    async insert(cuenta) {
      const result = await pool
        .request()
        .input('descripcion', sql.NVarChar(200), cuenta.descripcion)
        .query(
          'INSERT INTO cuentas (descripcion, estado) OUTPUT INSERTED.id VALUES (@descripcion, 1);'
        );
      return result.recordset[0].id;
    },

    // Cuenta activa por id; null si no existe o fue eliminada lógicamente.
    async findByIdActiva(id) {
      const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query('SELECT id, descripcion, estado FROM cuentas WHERE id = @id AND estado = 1;');
      const fila = result.recordset[0];
      return fila ? Cuenta.reconstruir(fila) : null;
    },

    // Cuentas activas (estado = 1).
    async findAllActivas() {
      const result = await pool
        .request()
        .query('SELECT id, descripcion, estado FROM cuentas WHERE estado = 1 ORDER BY id;');
      return result.recordset.map((fila) => Cuenta.reconstruir(fila));
    },

    // Actualiza la descripción de una cuenta activa.
    async update(cuenta) {
      await pool
        .request()
        .input('id', sql.Int, cuenta.id)
        .input('descripcion', sql.NVarChar(200), cuenta.descripcion)
        .query('UPDATE cuentas SET descripcion = @descripcion WHERE id = @id AND estado = 1;');
    },

    // Eliminación lógica (D5): estado → 0. La fila permanece en la BD.
    async eliminarLogico(id) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .query('UPDATE cuentas SET estado = 0 WHERE id = @id;');
    },
  };
}
