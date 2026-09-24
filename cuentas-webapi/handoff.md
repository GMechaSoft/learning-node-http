# 🚀 Development Handoff: US 1.2 — CRUD de notas débito/crédito (desarrollo + cierre dev-rápido)

**Date:** 2026-09-24  
**Repository Branch:** master (HEAD `4ad37d5` "CLI")

> Nota: el repo git vive un nivel arriba del workspace; los paths llevan prefijo `cuentas-webapi/` (igual que en `git status`). El handoff de US 1.1 quedó reemplazado por este.

---

## 🎯 1. Objective
Implementar la **US 1.2 (CRUD de notas débito/crédito)** sobre la arquitectura base aprobada (GPS D1–D11): 5 endpoints REST sobre `node:http` nativo (sin frameworks), **hexagonal + DDD + CQRS mínimo**, persistencia `mssql` v12 en MSSQL local (BD `cuentas_webapi`, tabla `notas`), contrato de errores JSON `{"error"}` (400/404/405/500) y **eliminación lógica** (`UPDATE estado=0`, nunca `DELETE` físico). Regla de negocio: la nota debe apuntar a una **cuenta activa existente** (404 si no).

## 📊 2. Current Status
- **Status:** Dev-Rápido **completado** — DoD verificada **22/22** contra API en vivo + eliminación lógica confirmada en BD (filas con `estado=0` intactas) + regresión US 1.1 limpia.
- Estado en `index.md`: **"Lista para Revisión"** (fase Revisión ⏳ Pendiente — es del workflow de Revisor/PO, no del dev-rápido).
- Métricas registradas: `dev_ia_session_minutes: 21` · `dev_manual_minutes: 5` · `dev_total_minutes: 26` · responsable `gerson.sanchez` · cierre `2026-09-24 15:50` (tabla de fases cerrada 16:07).
- **Pendiente de cierre: medición COSMIC/PNF.** `step-03b` encadenó `medir-historia` y el composite `preparar-medicion prelude` devolvió **HALT exit 3 `PENDING_STRATEGY/STRATEGY_NOT_APPROVED`** ("No existe measurement-strategy.json"); el intento quedó cerrado con ese estado (artefactos oficiales intactos) y quedó anotado en `cambios.md`. CFP/PNF siguen en `SIN_MEDICION`/`Pendiente` — **mismo antecedente que US 1.1**.
- **Working tree** (después de los commits `89b0d07`/`3342833`/`4ad37d5` del usuario):
  - `M  docs/stories/1.2-.../cambios.md` y `index.md` (cierre del step-03b)
  - `?? docs/stories/1.2-.../dev-record.md` (registro de desarrollo, aún sin commit)
  - `?? docs/stories/1.2-.../.medicion/attempts/20260924210756-53fc761c/` (intento HALT PENDING_STRATEGY — artefacto de auditoría; decidir si versionar o ignorar `.medicion/`)
- Arranque del servidor: `. .\.dev-env.ps1` (ya existe en la raíz, **gitignored**) y `npm run dev` (puerto 3000).
- BD local: tabla `notas` creada (DDL de referencia: `docs/sql/002-prerrequisito-notas.sql`); quedan 6 filas de prueba en `notas` (4 activas, 2 con `estado=0`) y 6 en `cuentas`.

## 🗂️ 3. Files in Progress (US 1.2 — ya commitados por el usuario)
- `src/domain/nota.js` — entidad `Nota` con invariantes: `tipo ∈ {debito, credito}`, `monto > 0` (finito), `cuentaId` int ≥ 1, `descripcion` no vacía → `CampoInvalidoError`; `Nota.crear` / `reconstruir` / `actualizar` / `aReadModel`.
- `src/domain/errores.js` — nueva jerarquía `NoEncontradaError` (base → 404) con `CuentaNoEncontradaError` y `NotaNoEncontradaError` (hermanos).
- `src/application/notas/ports.js` (puerto `NotaRepository`) · `commands.js` (`CrearNota`, `ActualizarNota`, `EliminarNota`) · `queries.js` (`ListarNotas`, `ObtenerNotaPorId`).
- `src/data/nota-repository.js` — INSERT `OUTPUT INSERTED.id`, SELECTs con `estado = 1`, `eliminarLogico` = `UPDATE notas SET estado = 0`.
- `src/interfaces/http/notas.js` — rutas `/notas` GET/POST, `/notas/{id}` GET/PUT/DELETE.
- `src/index.js` — composition root ampliado (`notaRepository` + `registrarRutasNotas`).
- `src/interfaces/http/errores.js` — `responderErrorDominio` usa `instanceof NoEncontradaError` → 404 (cubre ambas HU).
- `docs/sql/002-prerrequisito-notas.sql` · `docs/http/notas.http` (16 peticiones) · `docs/http/insomnia-cuentas-webapi-notas.yaml` (colección de 16; asume cuenta activa id=1 y nota id=1 libre).
- `.dev-env.example.ps1` (template) y `.dev-env.ps1` (con credenciales, gitignored); `.gitignore` ampliado.
- `docs/stories/1.2-crud-notas-debito-credito/`: `refinamiento.md` (14 tareas) y `dev-record.md` (cierre).

## 🛠️ 4. Changes Made
- **5 endpoints CRUD**: `GET /notas` (200), `POST /notas` (201 + `{id}`), `GET /notas/{id}` (200/404), `PUT /notas/{id}` (200/400/404), `DELETE /notas/{id}` (204/404 lógico). `405` + `Allow`, `400` (JSON inválido, tipo/monto/descripción/cuentaId inválidos, cuenta no existente o inactiva), `500` BD.
- **Orden de validación (bug real corregido en desarrollo)**: `Nota.crear` se valida **antes** de consultar la cuenta activa (si no, `cuentaId` no numérico llegaba a SQL → 500); `ActualizarNota` valida `cuerpo.cuentaId` antes de compararlo.
- **Regla de negocio**: cuenta destino debe existir y estar activa (`validarCuentaActiva` reutilizado de 1.1) → `CuentaNoEncontradaError` (404).
- **Cierre dev-rápido**: dev-record con 3 entradas de debug, métricas en frontmatter de `index.md` (registro máquina) + tabla de fases, 4 filas en `cambios.md`, estado `Lista para Revisión`, tracker `ninguna` (coherente con 1.1).

## ⚠️ 5. Attempts and Failures
- **Bug de orden de validación (corregido)**: `POST /notas` con `cuentaId: "una"` → 500 en vez de 400 (la consulta a `cuentas` se hacía antes de validar los invariantes de la nota). *Fix:* `Nota.crear(cuerpo)` antes de `validarCuentaActiva`; en PUT, `Nota._validarCuentaId` antes de la comparación. DoD re-ejecutada: 22/22.
- **DoD falsa negativo (script, no API)**: el script de DoD asumió `cuentaId=1` activa (id=1 estaba `estado=0` por la DoD de 1.1) y reutilizó el id de una nota ya eliminada → 13/22 en el primer run. *Fix:* descubrir cuenta activa con `GET /cuentas` y crear nota fresca para los tests con id.
- **Medición (HALT esperado)**: prelude en step-01 §6, step-02 §1b, step-02b §0 y cierre step-03b → todos exit 3 `STRATEGY_NOT_APPROVED` (no existe `measurement-strategy.json`). Causa justificada (una de las 4 cerradas): la preparación adelantada no se podía despachar sin strategy. Registrado en `cambios.md`; **no bloquea**: la medición oficial se corre después de `/ceiba-generar-strategy` + `ceiba-medir-historia`.

## 🔮 6. Next Steps (Upcoming Tasks)
1. 🔲 **Commitar los artefactos de cierre** del working tree: `dev-record.md`, `index.md`, `cambios.md` (+ decidir si versionar o ignorar `.medicion/attempts/`).
2. 🔲 **Verificación propia con Insomnia**: importar `docs/http/insomnia-cuentas-webapi-notas.yaml` (arrancar API con `. .\.dev-env.ps1; npm run dev`; la colección asume cuenta activa id=1 y nota id=1 libre).
3. 🔲 **Cerrar la medición** (aplica a **1.1 y 1.2**): `/ceiba-generar-strategy` (crea `docs/cosmic/measurement-strategy.json` aprobada) y luego `ceiba-medir-historia` para cada HU — quedan ambas con COSMIC/PNF `SIN_MEDICION`/`Pendiente`.
4. 🔲 **Revisión de código** (fase siguiente del ciclo, rol Revisor): `index.md` tiene Revisión ⏳ Pendiente.
5. 🔲 Opcional: limpiar filas de prueba de `cuentas`/`notas` (6+6) cuando la BD vuelva a ser de demo.
