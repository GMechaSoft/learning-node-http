// Pool mssql singleton a nivel de proceso (D9).
//
// Credenciales solo por variables de entorno (D4):
//   MSSQL_CONNECTION (cadena completa)  O  MSSQL_USER + MSSQL_PASS
//   (opcional MSSQL_SERVER, MSSQL_PORT, MSSQL_DATABASE) — default localhost:1433.
// Nunca hardcodeadas.

import sql from 'mssql';

let pool = null;

function configConexion() {
  if (process.env.MSSQL_CONNECTION) {
    return {
      connection: process.env.MSSQL_CONNECTION,
      options: { encrypt: false, trustServerCertificate: true },
    };
  }
  return {
    server: process.env.MSSQL_SERVER || 'localhost',
    port: Number(process.env.MSSQL_PORT || 1433),
    user: process.env.MSSQL_USER || '',
    password: process.env.MSSQL_PASS || '',
    database: process.env.MSSQL_DATABASE || '',
    // MSSQL local de curso: sin certificado TLS configurado.
    options: { encrypt: false, trustServerCertificate: true },
  };
}

// Crea y conecta el pool (fail fast: si no conecta, el proceso no arranca — D9).
export async function crearPool() {
  if (!pool) {
    pool = new sql.ConnectionPool(configConexion());
    await pool.connect();
  }
  return pool;
}

export function getPool() {
  return pool;
}

// Cierra el pool (SIGTERM/SIGINT — D9).
export async function cerrarPool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
