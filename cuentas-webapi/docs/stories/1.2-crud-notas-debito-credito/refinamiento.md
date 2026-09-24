## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-09-24

### Plan

**Plan: CRUD de notas débito/crédito (US 1.2)**
Arquitectura: Hexagonal (ports & adapters) + DDD ligero + CQRS mínimo — patrón de la US 1.1 reutilizado 1:1 (ESM, `node:http` nativo, `mssql` — GPS D1–D11)

**Pasos**
1. DDL prerrequisito tabla `notas` (GPS D8: CHECK tipo/monto + FK cuenta_id) + archivo de referencia + aplicación manual a la BD — referencia: `docs/sql/001-prerrequisito-cuentas.sql`
2. Entidad `Nota` con invariantes (tipo ∈ {debito, credito}; monto numérico positivo; descripción no vacía) — capa: `domain/` — referencia: `src/domain/cuenta.js`
3. Errores de dominio: clase base `NoEncontradaError` + `NotaNoEncontradaError` (refactor mínimo de `CuentaNoEncontradaError` para que herede de la base) — capa: `domain/` — referencia: `src/domain/errores.js`
4. Puerto `NotaRepository` (insert, findByIdActiva, findAllActivas, update, eliminarLogico) — capa: `application/notas/` — referencia: `src/application/cuentas/ports.js`
5. Commands `CrearNota` (valida cuenta activa vía puerto `CuentaRepository.findByIdActiva` → `CuentaNoEncontradaError` 404) / `ActualizarNota` (revalida invariants + cuenta si cambia) / `EliminarNota` — capa: `application/notas/` — referencia: `src/application/cuentas/commands.js`
6. Queries `ListarNotas` / `ObtenerNotaPorId` — capa: `application/notas/` — referencia: `src/application/cuentas/queries.js`
7. Repositorio MSSQL `nota-repository.js` (INSERT `OUTPUT INSERTED.id`, SELECT `estado = 1`, UPDATE, `UPDATE estado = 0` — nunca `DELETE` SQL) — capa: `data/` — referencia: `src/data/cuenta-repository.js`
8. Adapter HTTP `/notas` (5 endpoints + validación de forma + `extraerId`) — capa: `interfaces/http/` — referencia: `src/interfaces/http/cuentas.js`
9. Composition root: `crearNotaRepository(pool)` + `registrarRutasNotas` (DI de los dos puertos) — `src/index.js` — referencia: `src/index.js`
10. Verificación DoD manual: `docs/http/notas.http` + colección Insomnia + confirmación en BD (fila con `estado = 0`) — referencia: `docs/http/cuentas.http`, `docs/http/insomnia-cuentas-webapi.yaml`

**Archivos relevantes**
- `docs/architecture/index.md` — referencia: GPS D5/D7/D8/D11, DDL de referencia `notas`, flujos críticos (`POST /notas` → 404 si cuenta inexistente)
- `docs/architecture/coding-standards.md` — referencia: capas, nomenclatura, convención de testing manual (sin framework)
- `src/domain/cuenta.js` · `src/domain/errores.js` — referencia: patrón entidad (crear/reconstruir/aReadModel) y errores tipados
- `src/application/cuentas/{ports,commands,queries}.js` — referencia: CQRS + DI por parámetro
- `src/data/cuenta-repository.js` · `src/data/connection.js` — referencia: mapeo fila→entidad, pool singleton (se reutiliza)
- `src/interfaces/http/{cuentas,router,http,errores}.js` — referencia: adapter, router manual, `readJson`, traducción de errores
- `src/index.js` — referencia: composition root existente (se edita)
- `docs/http/cuentas.http` · `docs/http/insomnia-cuentas-webapi.yaml` · `docs/sql/001-prerrequisito-cuentas.sql` — referencia: artefactos de DoD/DDL de la análoga

**Reutilización**
- `src/interfaces/http/http.js` (readJson, responderJson, responderError) — se reutiliza tal cual en T8
- `src/interfaces/http/router.js` (crearRouter) — se reutiliza tal cual en T8
- `src/data/connection.js` (pool singleton) — se reutiliza tal cual en T7
- `src/application/cuentas/ports.js` (CuentaRepository.findByIdActiva) — se reutiliza en T5 para la regla "nota requiere cuenta existente"
- `src/domain/errores.js` — se edita (base `NoEncontradaError` + `NotaNoEncontradaError`)
- `src/interfaces/http/errores.js` — se edita (traduce `NoEncontradaError` → 404; cubre cuenta y nota sin duplicar)
- `src/index.js` — se edita (registro de notaRepository + rutas /notas)
- Nuevo (sin equivalente): `src/domain/nota.js`, `src/application/notas/{ports,commands,queries}.js`, `src/data/nota-repository.js`, `src/interfaces/http/notas.js`, `docs/http/notas.http`, `docs/http/insomnia-cuentas-webapi-notas.yaml`, `docs/sql/002-prerrequisito-notas.sql`

**Checklist**
☑ Feature análoga leída completa (US 1.1: domain, application, data, interfaces, index.js, .http, Insomnia, SQL) | ☑ TODOS los artefactos identificados (SQL = DDL prerrequisito `notas`, configs = composition root, tests = N/A por DoD manual) | ☑ Respeta arquitectura (D3 capas, D10 CQRS, D11 invariantes, D8 DDL) | ☑ Inventario de reutilización hecho

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| `src/interfaces/http/http.js` | Se reutiliza | `readJson`/`responderJson`/`responderError` son agnósticos del recurso |
| `src/interfaces/http/router.js` | Se reutiliza | `crearRouter` ya soporta plantillas `/notas` y `/notas/{id}` |
| `src/data/connection.js` | Se reutiliza | Pool singleton por proceso (D9): un solo pool para cuentas y notas |
| `src/application/cuentas/ports.js` | Se reutiliza | `CuentaRepository.findByIdActiva` valida la regla "nota requiere cuenta existente" (AC 3) |
| `src/domain/errores.js` | Se edita | Se añade base `NoEncontradaError` (cuenta y nota heredan) + `NotaNoEncontradaError` |
| `src/interfaces/http/errores.js` | Se edita | El check 404 pasa de `CuentaNoEncontradaError` a la base `NoEncontradaError` (cubre ambos sin duplicar) |
| `src/index.js` | Se edita | Composition root único (D3): se añaden `crearNotaRepository` y `registrarRutasNotas` |
| `docs/http/cuentas.http` | Se reutiliza | No se modifica; la DoD de 1.2 vive en su propio `notas.http` (convención por recurso) |
| `src/domain/nota.js` | Se crea | No hay equivalente: la entidad Nota (D3/D11) no existe aún |
| `src/application/notas/ports.js` | Se crea | No hay equivalente: el puerto NotaRepository no existe aún |
| `src/application/notas/commands.js` | Se crea | No hay equivalente: commands CQRS de notas no existen aún |
| `src/application/notas/queries.js` | Se crea | No hay equivalente: queries CQRS de notas no existen aún |
| `src/data/nota-repository.js` | Se crea | No hay equivalente: repositorio MSSQL de notas no existe aún |
| `src/interfaces/http/notas.js` | Se crea | No hay equivalente: adapter HTTP de /notas no existe aún |
| `docs/http/notas.http` | Se crea | Convención DoD manual del coding-standards §6 (verificación con cliente HTTP) |
| `docs/http/insomnia-cuentas-webapi-notas.yaml` | Se crea | Colección Insomnia de la DoD (misma convención que la de 1.1) |
| `docs/sql/002-prerrequisito-notas.sql` | Se crea | DDL de referencia del prerrequisito manual (GPS D8) |

### Tareas de Implementación

#### Fase 1: Base
- [ ] **T1: DDL prerrequisito `notas`** — archivo de referencia `docs/sql/002-prerrequisito-notas.sql` (DDL exacto del GPS: CHECK `tipo IN ('debito','credito')`, CHECK `monto > 0`, FK `cuenta_id → cuentas(id)`) y aplicación manual a la BD `cuentas_webapi` (fuera del alcance del código) — (Base: GPS D8, `docs/sql/001-prerrequisito-cuentas.sql`)
- [ ] **T2: Verificar prerrequisito MSSQL** — BD `cuentas_webapi` + tabla `notas` creada + al menos una cuenta activa en `cuentas` (regla de la AC 3) — (Base: GPS, límite del sistema)

#### Fase 2: Domain
- [ ] **T3: Entidad `Nota`** — `Nota.crear({ cuentaId, tipo, monto, descripcion })` / `Nota.reconstruir(fila)` / `Nota.actualizar(...)` / `Nota.aReadModel()`; invariantes: tipo ∈ {debito, credito}, monto numérico y > 0, descripción no vacía → `CampoInvalidoError` — `src/domain/nota.js` (Base: `src/domain/cuenta.js`)
- [ ] **T4: Errores de dominio** — clase base `NoEncontradaError` (404), `CuentaNoEncontradaError` pasa a extenderla (sin cambio de comportamiento de 1.1) y `NotaNoEncontradaError` nuevo — `src/domain/errores.js` (Base: `src/domain/errores.js`)

#### Fase 3: Application (CQRS)
- [ ] **T5: Puerto `NotaRepository`** (insert, findByIdActiva, findAllActivas, update, eliminarLogico) — `src/application/notas/ports.js` (Base: `src/application/cuentas/ports.js`)
- [ ] **T6: Commands** — `CrearNota({cuentaId,tipo,monto,descripcion}, {notaRepository,cuentaRepository})` (valida cuenta activa → `CuentaNoEncontradaError` 404), `ActualizarNota` (nota 404 + revalidación de cuenta si cambia `cuentaId`), `EliminarNota` (lógica) — `src/application/notas/commands.js` (Base: `src/application/cuentas/commands.js`)
- [ ] **T7: Queries** — `ListarNotas`, `ObtenerNotaPorId` (404 si no existe/elimina­da) — `src/application/notas/queries.js` (Base: `src/application/cuentas/queries.js`)

#### Fase 4: Data
- [ ] **T8: Repositorio MSSQL `notas`** — implementa el puerto: INSERT con `OUTPUT INSERTED.id`, SELECT `estado = 1`, UPDATE (cuenta_id, tipo, monto, descripción), `UPDATE estado = 0` (nunca `DELETE` SQL); mapeo fila→`Nota.reconstruir` — `src/data/nota-repository.js` (Base: `src/data/cuenta-repository.js`)

#### Fase 5: Interfaces + composition root
- [ ] **T9: Adapter HTTP `/notas`** — `registrarRutasNotas`: `GET /notas` (200), `POST /notas` (201 + id), `GET /notas/{id}` (200/404), `PUT /notas/{id}` (200/400/404), `DELETE /notas/{id}` (204/404); validación de forma con `readJson` + `extraerId`; 405/Allow y 404 de ruta ya los da el router — `src/interfaces/http/notas.js` (Base: `src/interfaces/http/cuentas.js`)
- [ ] **T10: Traducción de errores** — `responderErrorDominio` pasa a mapear la base `NoEncontradaError` → 404 (cuenta y nota) — `src/interfaces/http/errores.js` (Base: actual)
- [ ] **T11: Composition root** — `const notaRepository = crearNotaRepository(pool)` + `registrarRutasNotas(router, { notaRepository, cuentaRepository })`; los use cases de notas reciben ambos puertos por DI manual — `src/index.js` (Base: GPS D3/D10)

#### Fase 6: Verificación DoD
- [ ] **T12: Archivo `.http` con los escenarios de la DoD** — crear 201, listar 200, por id 200, actualizar 200, eliminar 204, eliminada 404, cuenta inexistente 404, tipo inválido 400, monto inválido 400, descripción vacía 400, JSON inválido 400, Content-Type 400, 405 + Allow, recurso inexistente 404, ruta inexistente 404 — `docs/http/notas.http` (Base: `docs/http/cuentas.http`)
- [ ] **T13: Colección Insomnia** — mismos escenarios importables, con el orden de ejecución y la premisa del id en la descripción — `docs/http/insomnia-cuentas-webapi-notas.yaml` (Base: `docs/http/insomnia-cuentas-webapi.yaml`)
- [ ] **T14: Ejecutar DoD manual** — correr los escenarios contra la API en :3000 y confirmar en BD: nota insertada, actualización persistida, eliminación lógica (`estado = 0`, fila sigue existiendo), 404 post-eliminación, 404 contra cuenta inexistente y que no se registró nota — (Base: coding-standards §6, DoD de `historia.md`)
