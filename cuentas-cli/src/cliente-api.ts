// Cliente HTTP fino (T5) — fetch nativo de Node (cero dependencias de runtime).
//
// - Cuerpo enviado solo si se provee, como JSON.
// - Cuerpo recibido parseado como JSON solo si el Content-Type lo indica;
//   204 (sin cuerpo) → undefined.
// - Error de red (API caída) → error tipado con mensaje claro.

import type { RespuestaApi } from './tipos.js';

export class ErrorRed extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorRed';
  }
}

export async function peticion(
  baseUrl: string,
  metodo: string,
  ruta: string,
  cuerpo?: unknown
): Promise<RespuestaApi> {
  let respuesta: Response;
  try {
    respuesta = await fetch(baseUrl.replace(/\/+$/, '') + ruta, {
      method: metodo,
      headers:
        cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch (err) {
    const causa = err instanceof Error ? err.message : String(err);
    throw new ErrorRed(`no se pudo contactar la API en ${baseUrl} (${causa})`);
  }

  const texto = await respuesta.text();
  const contentType = respuesta.headers.get('content-type') ?? '';
  const esJson = contentType.includes('application/json');
  const parseado: unknown = esJson && texto !== '' ? JSON.parse(texto) : undefined;

  return { estado: respuesta.status, cuerpo: parseado };
}
