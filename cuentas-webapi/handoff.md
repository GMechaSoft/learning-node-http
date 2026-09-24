# 🚀 Development Handoff: US 1.1 — CRUD de cuentas financieras (implementación)

**Date:** 2026-09-24  
**Repository Branch:** master (HEAD `8a215de` "Desarrollo" — todos los cambios de US 1.1 **ya commitados** por el usuario a las 15:03)

> Nota: el repo git vive un nivel arriba del workspace; los paths llevan prefijo `cuentas-webapi/` (igual que en `git status`). El handoff previo (fase Arquitecto/GPS) quedó reemplazado por este.

---

## 🎯 1. Objective
Implementar la **US 1.1 (CRUD de cuentas financieras)** sobre la arquitectura base aprobada (GPS D1–D11, handoff de la fase Arquitecto): Web API REST de cuentas con `node:http` nativo (sin frameworks), **hexagonal + DDD + CQRS mínimo**, persistencia `mssql` v12 en MSSQL local (BD `cuentas_webapi`, tabla `cuentas`), contrato de errores JSON `{"error"}` (400/404/405/500) y **eliminación lógica** (`UPDATE estado=0`, nunca `DELETE` físico).

## 📊 2. Current Status
- **Status:** Ready for Testing
- API completa y verificada: **DoD 12/12** peticiones contra API en vivo (las 7 AC de la US + contrato de errores) y eliminación lógica confirmada en BD (registro permanece con `estado=0`). El usuario está en verificación propia con la colección Insomnia.
- Arranque del servidor: en el terminal de PowerShell definir `$env:MSSQL_USER`, `$env:MSSQL_PASS`, `$env:MSSQL_DATABASE` y ejecutar `npm run dev` (puerto 3000). Sin credenciales en código (D4: fail fast si faltan env).
- Working tree limpio salvo `.vscode/learning-nodejs-http.code-workspace` (modificado, no de esta tarea).
- Pendiente de cierre: **medición** — el prelude de `medir-historia` quedó en HALT `PENDING_STRATEGY` (no existe `measurement-strategy.json`); CFP/PNF en `index.md` siguen en `SIN_MEDICION`/`Pendiente`.

## 🗂️ 3. Files in Progress
Incluidos en el commit `8a215de`:
- `cuentas-webapi/package.json` (D1/D2: `type:module`, `mssql ^12`, `engines ^24.21`, `dev: node --watch src/index.js`) + `cuentas-webapi/package-lock.json`
- `cuentas-webapi/src/index.js` (composition root: pool → repository → router → server; close en SIGINT/SIGTERM)
- `cuentas-webapi/src/domain/cuenta.js` · `cuentas-webapi/src/domain/errores.js`
- `cuentas-webapi/src/application/cuentas/ports.js` · `commands.js` · `queries.js`
- `cuentas-webapi/src/data/connection.js` · `cuentas-webapi/src/data/cuenta-repository.js`
- `cuentas-webapi/src/interfaces/http/http.js` · `router.js` · `errores.js` · `cuentas.js`
- `cuentas-webapi/docs/http/cuentas.http` · `cuentas-webapi/docs/http/insomnia-cuentas-webapi.yaml` (12 peticiones para la verificación)
- `cuentas-webapi/docs/sql/001-prerrequisito-cuentas.sql` (DDL de referencia, ya aplicado a la BD)
- `cuentas-webapi/docs/stories/1.1-crud-cuentas-financieras/` — `refinamiento.md` y `dev-record.md` nuevos; `index.md` (estado "Lista para Revisión", métricas 46 min) y `cambios.md` actualizados
- `cuentas-webapi/handoff.md` (este archivo)
- ⚠️ El commit también incluye `cuentas-webapi/do-d-result.txt` (artefacto temporal de la DoD — se puede eliminar si no se va a conservar).

## 🛠️ 4. Changes Made
- **6 endpoints CRUD**: `GET /cuentas` (200 lista), `POST /cuentas` (201 + `{id}`), `GET /cuentas/{id}` (200/404), `PUT /cuentas/{id}` (200/400/404), `DELETE /cuentas/{id}` (204/404, eliminación lógica). `405` + header `Allow` en método inválido sobre ruta existente; `404` JSON en ruta inexistente o cuenta eliminada; `400` JSON en JSON inválido, `Content-Type` incorrecto o descripción vacía; `500` JSON en error inesperado.
- **Dominio**: `Cuenta.crear` / `reconstruir` / `actualizarDescripcion` con invariante "descripción no vacía" → `CampoInvalidoError` (→400); `CuentaNoEncontradaError` (→404). `domain/` no importa HTTP ni `mssql` (regla D3).
- **CQRS**: commands (`CrearCuenta`, `ActualizarCuenta`, `EliminarCuenta`) y queries (`ListarCuentas`, `ObtenerCuentaPorId`) separados; puerto `CuentaRepository` en `application/cuentas/ports.js` implementado en `data/cuenta-repository.js` (SQL parametrizado, `OUTPUT INSERTED.id`).
- **Infraestructura**: pool MSSQL por env con fail fast en arranque y cierre en señal; router manual sobre `node:http` con plantillas `/cuentas/{id}`; `readJson` sobre promesa nativa.
- **BD**: `CREATE DATABASE cuentas_webapi` + tabla `cuentas` aplicadas al MSSQL local (Docker, puerto 1433).

## ⚠️ 5. Attempts and Failures
- **Attempt:** Primer run de la DoD contra la API recién implementada.
  - *Result:* Las rutas con `{id}` devolvían `400 {"error":"id inválido: undefined"}` — `router.js::extraer` indexaba los grupos de captura con el índice de la parte de la URL, pero las partes estáticas no crean grupos de captura. *Root cause:* confusión parte-index vs grupo de captura. *Fix:* contador `grupo` que solo incrementa por cada `{param}`. DoD re-ejecutada: 12/12.
- **Attempt:** Provisionar BD con una sola query que usaba separadores `GO`.
  - *Result:* `Incorrect syntax near 'GO'` — el driver `mssql` no parsea el separador de lotes (es del cliente sqlcmd). *Fix:* ejecutar `CREATE DATABASE` y `CREATE TABLE` como consultas separadas sobre pools distintas. El DDL de referencia en `docs/sql/` conserva el `GO` (pensado para sqlcmd).
- **Attempt:** Arrancar la API sin las variables de entorno (ocurrido en terminal del agente y reproducido por el usuario con `npm run dev`).
  - *Result:* `Login failed for user ''` — es el **fail fast esperado (D9)**, no un bug: hay que definir `$env:MSSQL_USER/MSSQL_PASS/MSSQL_DATABASE` en el MISMO terminal donde corre el servidor; `node --watch` no re-lee env al reiniciarse (requiere Ctrl+C + reinicio completo).
- **Attempt (medición):** Prelude de `medir-historia` (step-03b del dev-rapido) y rescates en steps 01/02/02b.
  - *Result:* HALT exit 3 `PENDING_STRATEGY/STRATEGY_NOT_APPROVED` en todos los puntos — no existe `measurement-strategy.json` en el repo. Registrado en `cambios.md`; la medición queda pendiente de `/ceiba-generar-strategy`.

## 🔮 6. Next Steps (Upcoming Tasks)
1. 🔲 Completar la verificación propia con Insomnia: importar `docs/http/insomnia-cuentas-webapi.yaml` (API arriba en :3000 con env; la colección asume que `id=1` está libre, notado en su descripción).
2. 🔲 Decidir cómo persistir las env de BD: wrapper `dev.ps1` en la raíz del workspace (opción recomendada, pendiente de confirmación del usuario) o `setx` (requiere terminal nuevo).
3. 🔲 Generar la estrategia de medición (`/ceiba-generar-strategy`) y luego correr `ceiba-medir-historia` para cerrar US 1.1 con CFP COSMIC (hoy `SIN_MEDICION`/`Pendiente`).
4. 🔲 Tratar los remanentes del working tree: eliminar `cuentas-webapi/do-d-result.txt` (artefacto temporal, ya commitado) y decidir sobre `.vscode/learning-nodejs-http.code-workspace` (modificado); commit resultante.
5. 🔲 Arrancar **US 1.2** (CRUD notas débito/crédito): reutilizar el patrón de 1.1 1:1 — entidad `src/domain/nota.js` (invariantes `tipo ∈ {debito, credito}`, `monto > 0`), `src/application/notas/`, `src/data/nota-repository.js`, rutas `/notas` + `/notas/{id}`; aplicar antes el DDL de la tabla `notas` del GPS (la BD hoy solo tiene `cuentas`).
