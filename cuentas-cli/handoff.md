# 🚀 Development Handoff: CLI de Ejecución Automatizada del Flujo de Cuentas y Notas (HU 2)

**Date:** 2026-09-24
**Repository Branch:** master

---

## 🎯 1. Objective
Construir en `cuentas-cli` un CLI **TypeScript sobre Node.js puro, sin frameworks** (decisión PO confirmada 2026-09-24; las directrices del GPS de la API —sin frameworks, Node.js puro, cero dependencias de runtime— se aplican también al CLI; la única excepción permitida es el lenguaje TypeScript) que ejecuta de forma secuencial 7 pasos contra la API `cuentas-webapi` (default `http://localhost:3000`, overridable por env `CUENTAS_API_BASE`), verificando código de estado y condiciones del cuerpo en cada paso (201+id, 200, 400 esperado por monto inválido, 204, 404 post-eliminación lógica). Fail fast: se detiene en el primer fallo, `exit 0` con 7/7 y `exit 1` con detalle del paso fallido (incluida API caída).

## 📊 2. Current Status
- **Status:** In Progress
- Plan técnico **aprobado** por el PO: `docs/stories/2-cli-flujo-integracion/refinamiento.md` — 8 tareas en 4 fases (T1–T2 base TS, T3–T5 núcleo CLI, T6–T7 flujo 7 pasos + orquestador, T8 DoD). Aún **no se ha escrito una sola línea de código**: `cuentas-cli` contiene solo `package.json` (commonjs, scripts placeholder) y los documentos de la HU.
- Huella de medición **pendiente** (mismo antecedente que las US 1.1/1.2): no existe `measurement-strategy.json` aprobado → la medición COSMIC/PNF correrá al cierre (esperado HALT `PENDING_STRATEGY` hasta ejecutar `/ceiba-generar-strategy`).

## 🗂️ 3. Files in Progress
**Existen (ya versionados en `878dd22` "HU CLI"):**
- `docs/stories/2-cli-flujo-integracion/historia.md`
- `docs/stories/2-cli-flujo-integracion/index.md`
- `docs/stories/2-cli-flujo-integracion/refinamiento.md`
- `docs/stories/2-cli-flujo-integracion/cambios.md`

**Por crear (según refinamiento.md):**
- `tsconfig.json` (T2: `module: NodeNext`, `target: ES2022`, `outDir: dist`, `strict: true`, `rootDir: src`)
- `src/config.ts` (T3: `obtenerBaseUrl()` — env `CUENTAS_API_BASE`, default `http://localhost:3000`)
- `src/tipos.ts` (T4: `Cuenta`, `Nota`, `CuentaInput`, `NotaInput`, `RespuestaApi`, `ResultadoPaso`, `ContextoFlujo`)
- `src/cliente-api.ts` (T5: `peticion(baseUrl, metodo, ruta, cuerpo?)` → `{ estado, cuerpo }` sobre `fetch` nativo; JSON solo si `content-type` lo indica; error de red → error tipado)
- `src/pasos.ts` (T6: arreglo `PASOS` con los 7 pasos y su `verificar(ctx, api)` con esperado vs real)
- `src/index.ts` (T7: orquestador secuencial fail fast + reporte + `process.exit(0/1)`)

**Por editar:**
- `package.json` (T1: migrar a `"type": "module"`, `engines: node ^24.21`, devDeps `typescript` + `tsx` + `@types/node`, scripts `dev` = `tsx src/index.ts` / `build` = `tsc` / `start` = `node dist/index.js`)

## 🛠️ 4. Changes Made
- **HU 2 creada** vía Dev-Rápido (step-00/00b): narrativa, 8 escenarios GWT (los 7 pasos + comportamiento global fail fast), disparadores y entidades declarados, tracker = `ninguna` (desarrollo directo).
- **Refinamiento técnico diseñado y aprobado** (step-01): stack zero runtime deps — `fetch` nativo, `tsc`/`tsx` solo devDeps; verificaciones por paso alineadas a los read-models reales de la API (`{ id, descripcion }` para cuenta; `{ id, cuentaId, tipo, monto, descripcion }` para nota; `201` + `{id}` en POST).
- **Decisión PO registrada** en `refinamiento.md` (Nota de contexto — stack del CLI): directrices de la API aplican al CLI; excepción = TypeScript.
- Work tree limpio: el usuario versionó los documentos en `878dd22` (master).

## ⚠️ 5. Attempts and Failures
- **Nota de contexto mal redactada (2 veces):**
  - *Result:* La versión original decía que las restricciones del GPS "no aplican a este CLI"; el PO corrigió: **sí aplican**, la única excepción es TypeScript. Corregido en `refinamiento.md` (redacción final en "Nota de contexto — stack del CLI").
  - *Lección:* en este proyecto las restricciones de la API son la base del CLI, no algo ajeno — no volver a plantear el CLI como exento de las directrices.
- **Medición en paralelo no lanzada (esperado):** `measurement-strategy.json` inexistente → prelude exit 3 `PENDING_STRATEGY/STRATEGY_NOT_APPROVED`. Causa declarada y justificada, no es un defecto; la medición correrá al cierre (step-03b) y volverá a HALT hasta que exista strategy aprobada.

## 🔮 6. Next Steps (Upcoming Tasks)
1. 🔲 Ejecutar **step-02-implement**: T1–T7 (`package.json`, `tsconfig.json`, `src/config.ts`, `src/tipos.ts`, `src/cliente-api.ts`, `src/pasos.ts`, `src/index.ts`) — plan aprobado en `refinamiento.md`.
2. 🔲 DoD (T8): arrancar API (`. .\.dev-env.ps1; npm run dev` en `cuentas-webapi`), correr `npm run dev` en `cuentas-cli` → 7/7 exit 0; API apagada → exit 1; `npm run build` limpio.
3. 🔲 Cierre Dev-Rápido: step-02b (se omitirá — sin preparación) → step-02c DoD → step-03 `dev-record.md` + métricas → step-03b registro + GUARDs (esperar HALT `PENDING_STRATEGY`) + medidores.
4. 🔲 (Lado usuario) `/ceiba-generar-strategy` + `ceiba-medir-historia` para las HU 1.1, 1.2 y 2 (todas `SIN_MEDICION`).
