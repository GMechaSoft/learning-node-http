## Dev Agent Record — Dev-Rápido

### Debug Log

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| 1 | Bug (orden de validación) | `POST /notas` con `cuentaId` no numérico devolvía `500`: la regla "cuenta existente" consultaba la BD ANTES de validar los invariantes de la nota | `Nota.crear` (invariantes → `CampoInvalidoError` 400) pasó antes de `validarCuentaActiva`; mismo orden en `ActualizarNota` (valida `cuentaId` antes de compararla). DoD re-ejecutada: 22/22 |
| 2 | Operativo | El primer run de la DoD falló 13/22: el script asumió `cuentaId=1` activa (era `estado=0` por la DoD de 1.1) y reutilizó el id de la nota ya eliminada | El script de DoD descubre la cuenta activa vía `GET /cuentas` y crea una nota fresca para las pruebas por id. La colección Insomnia documenta su premisa en la descripción |
| 3 | Operativo | `cosmic_location` no está en la config del proyecto (heredado de 1.1) | Se resolvió como `docs/cosmic/` (rutas de `ceiba-generar-strategy`); el rescate de medición del step-02 §1b salió **exit 3 `STRATEGY_NOT_APPROVED`** (no existe `measurement-strategy.json`) → se mide al cierre, igual que 1.1 |

### Completion Notes

- ⚡ Dev-Rápido: CRUD de notas débito/crédito (US 1.2) — patrón de la US 1.1 reutilizado 1:1 (hexagonal + DDD + CQRS mínimo, `node:http` nativo, `mssql`). DoD verificada **22/22** contra API en vivo: 5 endpoints (201/200/204/400/404/405+Allow), regla "nota requiere cuenta existente" (404 y sin insert), invariantes (tipo ∈ {debito,credito}, monto > 0, descripción no vacía → 400), eliminación lógica confirmada en BD (fila permanece con `estado=0`) y regresión 1.1 limpia (4 casos).
- Prerrequisito manual ejecutado: tabla `notas` creada en `cuentas_webapi` (DDL GPS D8, archivo de referencia `docs/sql/002-prerrequisito-notas.sql`).
- Reutilización real: `http.js`, `router.js`, `connection.js` y `CuentaRepository.findByIdActiva` intactos; `errores.js` pasó a base `NoEncontradaError` (cuenta y nota heredan, sin duplicar la traducción 404).
- Mecanismo de credenciales (remanescente del handoff 1.1, item 2): `.dev-env.example.ps1` como plantilla + `.dev-env.ps1` gitignored; arranque `. .\.dev-env.ps1; npm run dev`.
- Medición COSMIC/PNF: sin strategy aprobada (`STRATEGY_NOT_APPROVED`, re-verificado con el CLI en step-02 §1b y step-02b) → se mide al cierre con `medir-historia` tras `/ceiba-generar-strategy`.

### File List

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Creado | `src/domain/nota.js` | Entidad `Nota` + invariantes (tipo ∈ {debito,credito}, monto > 0, descripción no vacía) |
| Modificado | `src/domain/errores.js` | Base `NoEncontradaError` + `NotaNoEncontradaError`; `CuentaNoEncontradaError` hereda de la base |
| Creado | `src/application/notas/ports.js` | Puerto `NotaRepository` (contrato) |
| Creado | `src/application/notas/commands.js` | `CrearNota` (cuenta activa → 404), `ActualizarNota`, `EliminarNota` (DI por parámetro) |
| Creado | `src/application/notas/queries.js` | `ListarNotas`, `ObtenerNotaPorId` |
| Creado | `src/data/nota-repository.js` | Repositorio MSSQL (INSERT `OUTPUT id`, SELECT `estado=1`, UPDATE, `UPDATE estado=0` — nunca DELETE) |
| Creado | `src/interfaces/http/notas.js` | Adapter `/notas` (GET/POST/PUT/DELETE + `{id}`) |
| Modificado | `src/interfaces/http/errores.js` | El check 404 mira la base `NoEncontradaError` (cuenta y nota) |
| Modificado | `src/index.js` | Composition root: `crearNotaRepository` + `registrarRutasNotas` (DI de los dos puertos) |
| Creado | `docs/sql/002-prerrequisito-notas.sql` | DDL prerrequisito de la tabla `notas` (GPS D8) para referencia |
| Creado | `docs/http/notas.http` | 16 peticiones cubriendo los 5 escenarios de la DoD |
| Creado | `docs/http/insomnia-cuentas-webapi-notas.yaml` | Colección Insomnia (16 requests, premisa del id documentada) |
| Creado | `.dev-env.example.ps1` | Plantilla de credenciales de desarrollo (D4) |
| Modificado | `.gitignore` | `.dev-env.ps1` y `.env` fuera del repo |
| Aplicado en BD | `notas` (tabla) | DDL GPS D8 aplicado al MSSQL local (prerrequisito manual) |

### Métricas Dev-Rápido

- Tiempo sesión IA: 21 min
- Tareas manuales DoD: 5 min
- Tiempo total: 26 min
