## Dev Agent Record — Dev-Rápido

### Debug Log

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| 1 | Bug | Router: `params.id` llegaba `undefined` — el índice del grupo de captura (`match[i+1]`) no coincide con la posición de la parte cuando hay partes estáticas antes (`/cuentas/{id}`) | Contador de grupos independientes de la posición de la parte; re-ejecutada DoD: 12/12 correctos |
| 2 | Bug (script) | `provision-db.mjs`: el driver `mssql` no interpreta `GO` (batch separator de sqlcmd) | Sentencias DDL ejecutadas por separado (CREATE DATABASE / CREATE TABLE) |
| 3 | Operativo | Arranque de la API con `Login failed for user ''`: las variables env no heredan entre sesiones de terminal | Definir `MSSQL_USER`/`MSSQL_PASS`/`MSSQL_DATABASE` en el mismo proceso que arranca la API (fail fast D9 comportándose como se diseñó) |

### Completion Notes

- ⚡ Dev-Rápido: CRUD de cuentas financieras (US 1.1) — Web API `node:http` nativo + MSSQL, arquitectura hexagonal + CQRS (D1–D11 del GPS). DoD verificada 12/12 escenarios (201/200/204/400/404/405) + eliminación lógica confirmada en BD (fila `id=1` con `estado=0`, sin borrado físico).
- Prerrequisito manual ejecutado: BD `cuentas_webapi` + tabla `cuentas` creadas (DDL del GPS; la tabla `notas` llega con la HU 1.2).
- Medición COSMIC/PNF: sin strategy aprobada (`STRATEGY_NOT_APPROVED`, verificado 3 veces con el CLI) → se mide al cierre con `medir-historia`.

### File List

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Modificado | `package.json` | D1/D2: `"type": "module"`, `mssql ^12`, `engines ^24.21`, `dev: node --watch src/index.js` |
| Creado | `src/domain/cuenta.js` | Entidad `Cuenta` + invariante (descripción no vacía) |
| Creado | `src/domain/errores.js` | `ErrorDominio`, `CampoInvalidoError`, `CuentaNoEncontradaError` |
| Creado | `src/application/cuentas/ports.js` | Puerto `CuentaRepository` (contrato) |
| Creado | `src/application/cuentas/commands.js` | `CrearCuenta`, `ActualizarCuenta`, `EliminarCuenta` (DI por parámetro) |
| Creado | `src/application/cuentas/queries.js` | `ListarCuentas`, `ObtenerCuentaPorId` |
| Creado | `src/data/connection.js` | Pool mssql singleton por env, fail fast, cierre en SIGTERM/SIGINT |
| Creado | `src/data/cuenta-repository.js` | Repositorio MSSQL (INSERT/SELECT/UPDATE; eliminación lógica, nunca DELETE) |
| Creado | `src/interfaces/http/http.js` | `readJson(req)` en promesa + respuestas JSON |
| Creado | `src/interfaces/http/router.js` | Router manual: match método+ruta, 405 con `Allow`, 404 |
| Creado | `src/interfaces/http/errores.js` | Traducción errores de dominio → 400/404/500 |
| Creado | `src/interfaces/http/cuentas.js` | Routes `/cuentas` y `/cuentas/{id}` (GET/POST/PUT/DELETE) |
| Creado | `src/index.js` | Composition root: DI manual + server + SIGTERM |
| Creado | `docs/http/cuentas.http` | 11 peticiones cubriendo los 7 escenarios de la DoD |
| Creado | `docs/sql/001-prerrequisito-cuentas.sql` | DDL prerrequisito (BD + tabla cuentas) para referencia |

### Métricas Dev-Rápido

- Tiempo sesión IA: 36 min
- Tareas manuales DoD: 10 min
- Tiempo total: 46 min
