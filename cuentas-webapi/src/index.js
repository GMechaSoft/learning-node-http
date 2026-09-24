// Composition root (D3/D10): DI manual pool → repositorio → use cases →
// router, más el servidor node:http. Es el ÚNICO lugar de ensamblaje.

import http from 'node:http';
import { crearPool, cerrarPool } from './data/connection.js';
import { crearCuentaRepository } from './data/cuenta-repository.js';
import { crearNotaRepository } from './data/nota-repository.js';
import { crearRouter } from './interfaces/http/router.js';
import { registrarRutasCuentas } from './interfaces/http/cuentas.js';
import { registrarRutasNotas } from './interfaces/http/notas.js';
import { responderErrorDominio } from './interfaces/http/errores.js';

const PUERTO = Number(process.env.PORT || 3000);

async function main() {
  // D9: fail fast — si el pool no conecta, el proceso no sirve tráfico.
  const pool = await crearPool();

  const cuentaRepository = crearCuentaRepository(pool);
  const notaRepository = crearNotaRepository(pool);

  const router = crearRouter();
  registrarRutasCuentas(router, { repository: cuentaRepository });
  registrarRutasNotas(router, { notaRepository, cuentaRepository });

  const server = http.createServer(async (req, res) => {
    try {
      await router.manejar(req, res);
    } catch (err) {
      responderErrorDominio(res, err);
    }
  });

  server.listen(PUERTO, () => {
    console.log(`cuentas-webapi escuchando en http://localhost:${PUERTO}`);
  });

  const cerrar = async (senal) => {
    console.log(`recibida ${senal}: cerrando servidor y pool`);
    server.close();
    await cerrarPool();
    process.exit(0);
  };
  process.on('SIGTERM', () => cerrar('SIGTERM'));
  process.on('SIGINT', () => cerrar('SIGINT'));
}

main().catch((err) => {
  console.error('error de arranque:', err.message);
  process.exit(1);
});
