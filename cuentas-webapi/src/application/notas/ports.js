// Puerto NotaRepository (D3/D10).
//
// Contrato de repositores del que depende la aplicación. La implementación
// sobre mssql vive en data/nota-repository.js y se inyecta manualmente en el
// composition root (src/index.js). La aplicación NUNCA importa data/.
//
// Los stubs lanzan para evitar usar el puerto por error: solo se usa la
// implementación inyectada.

export const NotaRepository = Object.freeze({
  // Inserta una nota y devuelve el id generado (INT IDENTITY).
  insert: async (nota) => { throw new Error('NotaRepository.insert: sin implementar'); },

  // Nota activa por id, o null si no existe / está eliminada.
  findByIdActiva: async (id) => { throw new Error('NotaRepository.findByIdActiva: sin implementar'); },

  // Todas las notas activas (estado = 1).
  findAllActivas: async () => { throw new Error('NotaRepository.findAllActivas: sin implementar'); },

  // Actualiza los datos de una nota (cuenta_id, tipo, monto, descripción).
  update: async (nota) => { throw new Error('NotaRepository.update: sin implementar'); },

  // Eliminación lógica: UPDATE estado = 0. Nunca DELETE SQL (D5/D8).
  eliminarLogico: async (id) => { throw new Error('NotaRepository.eliminarLogico: sin implementar'); },
});
