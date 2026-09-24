// Router manual sobre node:http (D7).
//
//   - match de método + ruta (plantillas como '/cuentas/{id}')
//   - 405 con header Allow si la ruta existe con otros métodos
//   - 404 JSON si la ruta no existe

import { responderError } from './http.js';

const CACHE_REGEX = new Map();

function compilar(template) {
  if (!CACHE_REGEX.has(template)) {
    const partes = template.split('/').filter(Boolean);
    const regex = new RegExp(
      `^/${partes.map((p) => (p.startsWith('{') ? '([^/]+)' : p)).join('/')}$`
    );
    const extraer = (match) => {
      const params = {};
      let grupo = 1;
      partes.forEach((p) => {
        if (p.startsWith('{')) {
          params[p.slice(1, -1)] = decodeURIComponent(match[grupo]);
          grupo += 1;
        }
      });
      return params;
    };
    CACHE_REGEX.set(template, { regex, extraer });
  }
  return CACHE_REGEX.get(template);
}

export function crearRouter() {
  const rutas = new Map(); // plantilla -> Map<metodo, handler>

  function anadir(plantilla, metodo, handler) {
    if (!rutas.has(plantilla)) rutas.set(plantilla, new Map());
    rutas.get(plantilla).set(metodo, handler);
  }

  function matchear(pathname) {
    for (const [plantilla, metodos] of rutas) {
      const { regex, extraer } = compilar(plantilla);
      const match = pathname.match(regex);
      if (match) return { metodos, params: extraer(match) };
    }
    return null;
  }

  async function manejar(req, res) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const ruta = matchear(pathname);
    if (!ruta) {
      responderError(res, 404, `ruta ${pathname} no existe`);
      return;
    }
    if (!ruta.metodos.has(req.method)) {
      res.setHeader('Allow', [...ruta.metodos.keys()].join(', '));
      responderError(res, 405, `método ${req.method} no permitido en esta ruta`);
      return;
    }
    await ruta.metodos.get(req.method)(req, res, ruta.params);
  }

  return { anadir, manejar };
}
