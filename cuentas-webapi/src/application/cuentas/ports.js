// Puerto CuentaRepository (D3/D10).
//
// Contrato de repositores del que depende la aplicación. La implementación
// sobre mssql vive en data/cuenta-repository.js y se inyecta manualmente en el
// composition root (src/index.js). La aplicación NUNCA importa data/.
//
// Los stubs lanzan para evitar usar el puerto por error: solo se usa la
// implementación inyectada.

export const CuentaRepository = Object.freeze({
  // Inserta una cuenta y devuelve el id generado (INT IDENTITY).
  insert: async (cuenta) => { throw new Error('CuentaRepository.insert: sin implementar'); },

  // Cuenta activa por id, o null si no existe / está eliminada.
  findByIdActiva: async (id) => { throw new Error('CuentaRepository.findByIdActiva: sin implementar'); },

  // Todas las cuentas activas (estado = 1).
  findAllActivas: async () => { throw new Error('CuentaRepository.findAllActivas: sin implementar'); },

  // Actualiza la descripción de una cuenta.
  update: async (cuenta) => { throw new Error('CuentaRepository.update: sin implementar'); },

  // Eliminación lógica: UPDATE estado = 0. Nunca DELETE SQL (D5/D8).
  eliminarLogico: async (id) => { throw new Error('CuentaRepository.eliminarLogico: sin implementar'); },
});
