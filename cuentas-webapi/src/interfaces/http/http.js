// Helpers del adapter HTTP: lectura de body JSON en promesa y respuestas JSON.
//
// node:http es por eventos; readJson(req) lo encapsula en promesa (NFR).

// Lee el body como JSON. Rechaza (status 400) si:
//   - Content-Type no es application/json
//   - el body está vacío
//   - el body no es JSON válido
export function readJson(req) {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      reject({ status: 400, error: 'Content-Type debe ser application/json' });
      return;
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (body === '') {
        reject({ status: 400, error: 'body vacío' });
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject({ status: 400, error: 'body no es JSON válido' });
      }
    });
    req.on('error', () => {
      reject({ status: 400, error: 'error leyendo el body' });
    });
  });
}

// Responde JSON. Con status 204 (o data undefined) no envía cuerpo.
export function responderJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(data === undefined ? '' : JSON.stringify(data));
}

// Responde error JSON { "error": "..." } (contrato del GPS).
export function responderError(res, status, mensaje) {
  responderJson(res, status, { error: mensaje });
}
