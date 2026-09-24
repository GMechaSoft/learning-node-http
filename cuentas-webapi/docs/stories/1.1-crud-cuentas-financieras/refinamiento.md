## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-09-24

### Plan

**Plan: CRUD de cuentas financieras (US 1.1)**
Arquitectura: Hexagonal (ports & adapters) + DDD ligero + CQRS mínimo — ESM, `node:http` nativo, `mssql` (GPS D1–D11)

**Pasos**
1. Corregir `package.json` (D1/D2: `type: module`, `mssql ^12`, `engines ^24.21`, `dev` sin bucle) + `npm install` — componente: root — referencia: GPS D2
2. Entidad `Cuenta` + invariantes y errores de dominio — capa: `domain/` — referencia: GPS D11
3. Puerto `CuentaRepository` — capa: `application/cuentas/` — referencia: GPS D3/D10
4. Commands `CrearCuenta`/`ActualizarCuenta`/`EliminarCuenta` — capa: `application/cuentas/` — depende de 2 y 3
5. Queries `ListarCuentas`/`ObtenerCuentaPorId` — capa: `application/cuentas/` — depende de 3
6. Pool singleton por env + repositorio MSSQL (INSERT/SELECT/UPDATE; DELETE lógico) — capa: `data/` — depende de 3, referencia: GPS D4/D5/D6/D9
7. Adapter HTTP `/cuentas` (router manual, `readJson`, 400/404/405/500) — capa: `interfaces/http/` — depende de 4 y 5, referencia: GPS D7
8. Composition root: DI manual (pool → repo → use cases → router) + `SIGTERM` — `src/index.js` — depende de todos, referencia: GPS D10
9. Verificación DoD manual: archivo `.http` con los 7 escenarios + confirmación en BD (estado = 0) — referencia: coding-standards §6

**Archivos relevantes**
- `docs/architecture/index.md` — referencia: GPS completo (D1–D11, DDL de referencia, contrato de errores)
- `docs/architecture/coding-standards.md` — referencia: nomenclatura, capas, manejo de errores, prohibiciones
- `package.json` — referencia: estado real actual (commonjs, script dev auto-referencial)
- `src/index.js` — referencia: vacío (pre-implementación); será el composition root
- `docs/stories/1.1-crud-cuentas-financieras/historia.md` — referencia: 7 escenarios AC

**Reutilización**
- `package.json` — se reutiliza (se edita, no se crea) en la T1
- Todo lo demás se crea nuevo: no existe feature análoga implementada en el proyecto (`src/` vacío; verificado por escaneo)

**Checklist**
☑ Feature análoga leída completa (no existe — `src/index.js` vacío, verificado) | ☑ TODOS los artefactos identificados (SQL = DDL prerrequisito manual ya en GPS, configs = package.json, tests = N/A por DoD manual) | ☑ Respeta arquitectura (D3 capas, D10 CQRS, D11 invariantes) | ☑ Inventario de reutilización hecho

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| `package.json` | Se reutiliza | Se corrige según D1/D2 (type, deps, engines, script dev); no se reemplaza |
| `docs/architecture/index.md` | Se reutiliza | GPS con DDL de referencia y contrato de errores; no se modifica |
| `src/domain/cuenta.js` | Se crea | No hay equivalente: `src/` está vacío (proyecto pre-implementación) |
| `src/domain/errores.js` | Se crea | No hay equivalente: los errores tipados (D11) no existen aún |
| `src/application/cuentas/ports.js` | Se crea | No hay equivalente: el contrato de repositores (D3/D10) no existe aún |
| `src/application/cuentas/commands.js` | Se crea | No hay equivalente: commands CQRS (D10) no existen aún |
| `src/application/cuentas/queries.js` | Se crea | No hay equivalente: queries CQRS (D10) no existen aún |
| `src/data/connection.js` | Se crea | No hay equivalente: el pool singleton (D9) no existe aún |
| `src/data/cuenta-repository.js` | Se crea | No hay equivalente: repositorio MSSQL no existe aún |
| `src/interfaces/http/cuentas.js` | Se crea | No hay equivalente: el adapter HTTP no existe aún |
| `src/index.js` | Se reutiliza (vacío) | Ya existe como punto de entrada; se escribe el composition root (D3) |
| `docs/http/cuentas.http` | Se crea | Convención DoD manual del coding-standards §6 (verificación con cliente HTTP) |

### Tareas de Implementación

#### Fase 1: Base
- [x] **T1: Aplicar D1/D2 a `package.json`** (`"type": "module"`, `dependencies: mssql ^12`, `engines: node ^24.21`, `dev: node --watch src/index.js`) y ejecutar `npm install` — `package.json` (Base: GPS D2)
- [x] **T2: Verificar prerrequisito MSSQL** — BD local + tabla `cuentas` (DDL del GPS) + env `MSSQL_USER`/`MSSQL_PASS` o `MSSQL_CONNECTION` disponibles (prerrequisito manual, fuera del código) — puerto 1433 abierto; env por definir en el proceso que corra la API

#### Fase 2: Domain
- [x] **T3: Entidad `Cuenta` con invariante (descripción no vacía)** — `src/domain/cuenta.js` (Base: GPS D11)
- [x] **T4: Errores de dominio tipados** `CuentaNoEncontradaError`, `CampoInvalidoError` — `src/domain/errores.js` (Base: GPS D11)

#### Fase 3: Application (CQRS)
- [x] **T5: Puerto `CuentaRepository`** (insert, findByIdActiva, findAllActivas, update, eliminarLogico) — `src/application/cuentas/ports.js` (Base: GPS D3/D10)
- [x] **T6: Commands** `CrearCuenta`, `ActualizarCuenta`, `EliminarCuenta` (DI por parámetro) — `src/application/cuentas/commands.js` (Base: GPS D10)
- [x] **T7: Queries** `ListarCuentas`, `ObtenerCuentaPorId` (DI por parámetro) — `src/application/cuentas/queries.js` (Base: GPS D10)

#### Fase 4: Data
- [x] **T8: Pool singleton** por env (default localhost:1433), `connect()` al arrancar, `close()` en `SIGTERM` — `src/data/connection.js` (Base: GPS D4/D9)
- [x] **T9: Repositorio MSSQL** implementando el puerto (SELECT `estado = 1`, INSERT con `result.inserted.id`, UPDATE descripción, `UPDATE estado = 0` — nunca `DELETE` SQL) — `src/data/cuenta-repository.js` (Base: GPS D5/D6/D8)

#### Fase 5: Interfaces + composition root
- [x] **T10: Adapter HTTP `/cuentas`** — router manual (405 + `Allow` en ruta existente, 404 ruta inexistente), `readJson(req)` en promesa (400 Content-Type/JSON), traducción errores de dominio → 400/404/500 JSON `{ "error": "..." }` — `src/interfaces/http/cuentas.js` (Base: GPS D7/D11)
- [x] **T11: Composition root** — DI manual (pool → repo → use cases → router), servidor `node:http`, `pool.connect()` en arranque (fallo rápido), `close()` en `SIGTERM` — `src/index.js` (Base: GPS D3/D10)

#### Fase 6: Verificación DoD
- [x] **T12: Archivo `.http` con los 7 escenarios** (crear 201, listar 200, por id 200, actualizar 200, eliminar 204, body inválido 400, 405, 404) — `docs/http/cuentas.http` (Base: coding-standards §6)
- [x] **T13: Ejecutar DoD manual** — correr los escenarios contra la API y confirmar en BD: registro insertado, actualización persistida, eliminación lógica (`estado = 0`, fila sigue existiendo), 404 post-eliminación — ejecutado 2026-09-24: 12/12 casos correctos; BD: fila id=1 con `estado=0` (no borrada)
