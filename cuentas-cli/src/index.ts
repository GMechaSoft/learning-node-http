// Orquestador (T7) — ejecución secuencial fail fast de los 7 pasos,
// reporte por paso y resumen final; exit 0 con 7/7, exit 1 en el primer fallo.

import { obtenerBaseUrl } from './config.js';
import { PASOS, TOTAL_PASOS } from './pasos.js';
import type { ContextoFlujo, ResultadoPaso } from './tipos.js';

async function main(): Promise<void> {
  const api = obtenerBaseUrl();
  const ctx: ContextoFlujo = {};
  let exitosos = 0;

  console.log(`Flujo de integración — API ${api}`);

  for (const paso of PASOS) {
    const ruta = typeof paso.ruta === 'function' ? paso.ruta(ctx) : paso.ruta;
    let resultado: ResultadoPaso;
    try {
      const { res, resultado: ver } = await paso.ejecutar(ctx, api);
      resultado = ver;
      if (paso.capturar) paso.capturar(ctx, res);
    } catch (err) {
      // API caída / fallo de red → el paso falla con el detalle del error.
      resultado = {
        exitoso: false,
        esperado: 'respuesta de la API',
        real: err instanceof Error ? err.message : String(err),
      };
    }

    if (resultado.exitoso) {
      exitosos += 1;
      console.log(
        `Paso ${paso.numero} — ${paso.nombre} — ${paso.metodo} ${ruta} — esperado ${resultado.esperado} → real ${resultado.real} — ✅`
      );
    } else {
      console.log(
        `Paso ${paso.numero} — ${paso.nombre} — ${paso.metodo} ${ruta} — esperado ${resultado.esperado} → real ${resultado.real} — ❌`
      );
      console.log('');
      console.log(
        `❌ Flujo detenido en el Paso ${paso.numero} (${paso.nombre}) — detalle: ${resultado.real}`
      );
      console.log(`Resumen: ${exitosos}/${TOTAL_PASOS} pasos exitosos`);
      process.exit(1);
    }
  }

  console.log('');
  console.log(`Resumen: ${exitosos}/${TOTAL_PASOS} pasos exitosos — ✅ flujo completo`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(`❌ Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
