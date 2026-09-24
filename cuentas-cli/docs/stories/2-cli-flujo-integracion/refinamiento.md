## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-09-24

### Plan

**Plan: CLI TypeScript de ejecución automatizada del flujo de cuentas y notas (HU 2)**
Arquitectura: CLI de un solo comando (PoC) — TypeScript ESM con `fetch` nativo (cero dependencias de runtime), `tsx` en dev + `tsc` para build. Estructura por responsabilidad: entry/orquestador, cliente HTTP fino, pasos del flujo y tipos.

**Nota de medición**: sin `measurement-strategy.json` aprobado en `cuentas-webapi/docs/cosmic/` → §2c/§7 omitidos por compuerta 2; se medirá al cierre.

**Nota de contexto — stack del CLI**
- Las directrices del GPS de la API (sin frameworks, Node.js puro, cero dependencias de runtime) **se aplican también a este CLI**.
- **Excepción permitida (decisión PO, confirmada 2026-09-24)**: el código se escribe en **TypeScript** — el lenguaje sí cambia, la regla de "sin frameworks" se mantiene.
- Consecuencias en el stack: `fetch` nativo de Node para HTTP, `tsc` + `tsx` solo en devDependencies (herramientas de compilación, no de runtime) y binario final ejecutado con Node.js ≥ 24.

**Pasos**
1. Base del proyecto TS — componente: raíz — referencia: `package.json` actual (commonjs, scripts placeholder) y `cuentas-webapi/package.json` (patrón `engines` + scripts)
2. Config de URL base — componente: `src/config.ts` — referencia: patrón env de la API (GPS D4: valores por env con default)
3. Tipos del flujo — componente: `src/tipos.ts` — referencia: contratos de respuesta de la API (201 + id, read-model de cuenta/nota)
4. Cliente HTTP fino — componente: `src/cliente-api.ts` — referencia: `fetch` nativo de Node 24; contrato de errores de la API (JSON `{ "error" }`)
5. Los 7 pasos del flujo con sus verificaciones — componente: `src/pasos.ts` — referencia: los 7 pasos del PRD + cuerpos de request de `cuentas-webapi/docs/http/notas.http` e `insomnia-cuentas-webapi-notas.yaml`
6. Orquestador secuencial fail fast + reporte + código de salida — componente: `src/index.ts` — referencia: AC Escenario 8 de `historia.md`
7. DoD: ejecutar el flujo completo contra la API en `:3000` (7/7, exit 0) y verificar fail fast con API caída (exit 1) — referencia: DoD manual de `cuentas-webapi` (código-standards §6)

**Archivos relevantes**
- `cuentas-cli/package.json` — referencia: estado actual (type commonjs, sin devDeps, scripts placeholder) → se migra a ESM + TS
- `cuentas-webapi/docs/architecture/index.md` — referencia: contrato de estados (201/200/400/204/404), eliminación lógica, read-models
- `cuentas-webapi/docs/http/notas.http` · `cuentas-webapi/docs/http/insomnia-cuentas-webapi-notas.yaml` — referencia: cuerpos exactos de los requests de cuentas y notas (se reutilizan como valores de los pasos)
- `cuentas-webapi/src/interfaces/http/cuentas.js` · `notas.js` — referencia: forma de las respuestas (201 + `{id}`, read-model con `estado`)

**Reutilización**
- `fetch` nativo de Node ≥ 18 — se reutiliza: cero dependencias de runtime (decisión PO)
- Cuerpos de request de `cuentas-webapi/docs/http/*.http` — se reutilizan como valores de los 7 pasos (mismos datos que la DoD manual)
- `package.json` de `cuentas-cli` — se edita (migración a ESM + TS + devDeps)
- Nuevo (sin equivalente, proyecto vacío): `tsconfig.json`, `src/config.ts`, `src/tipos.ts`, `src/cliente-api.ts`, `src/pasos.ts`, `src/index.ts`

**Checklist**
☑ Feature análoga leída completa (DoD manual de la API: `.http` + Insomnia + contratos HTTP de `interfaces/http/`) | ☑ TODOS los artefactos identificados (SQL = N/A, el CLI no toca BD; configs = `tsconfig.json` + `package.json`; tests = N/A por DoD de ejecución contra la API real) | ☑ Respeta arquitectura (CLI autocontenido, una responsabilidad por archivo, fail fast) | ☑ Inventario de reutilización hecho

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| `fetch` nativo de Node | Se reutiliza | API HTTP simple; zero runtime deps (decisión PO) |
| Cuerpos de `cuentas-webapi/docs/http/notas.http` / `cuentas.http` | Se reutilizan | Mismos payloads que la DoD manual; consistencia entre verificaciones |
| `cuentas-cli/package.json` | Se edita | Migración commonjs → ESM + scripts `dev`/`build`/`start` + devDeps |
| `tsconfig.json` | Se crea | No existe: el proyecto aún no compila TypeScript |
| `src/config.ts` | Se crea | No hay equivalente: URL base por env no existe aún |
| `src/tipos.ts` | Se crea | No hay equivalente: tipos del flujo no existen aún |
| `src/cliente-api.ts` | Se crea | No hay equivalente: wrapper de `fetch` no existe aún |
| `src/pasos.ts` | Se crea | No hay equivalente: los 7 pasos no existen aún |
| `src/index.ts` | Se crea | No hay equivalente: orquestador no existe aún |

### Tareas de Implementación

#### Fase 1: Base del proyecto
- [x] **T1: Migrar `package.json` a ESM + TS** — `"type": "module"`, `engines: node ^24.21`, devDependencies `typescript` + `tsx` + `@types/node`, scripts: `dev` = `tsx src/index.ts`, `build` = `tsc`, `start` = `node dist/index.js` — `package.json` (Base: `cuentas-webapi/package.json`)
- [ ] **T2: `tsconfig.json`** — `module: NodeNext`, `moduleResolution: NodeNext`, `target: ES2022`, `outDir: dist`, `strict: true`, `rootDir: src` — `tsconfig.json`

#### Fase 2: Núcleo del CLI
- [ ] **T3: Config** — `obtenerBaseUrl()`: env `CUENTAS_API_BASE` con default `http://localhost:3000` — `src/config.ts` (Base: patrón env GPS D4)
- [ ] **T4: Tipos del flujo** — `Cuenta`, `Nota`, `CuentaInput`, `NotaInput`, `RespuestaApi`, `ResultadoPaso`, `ContextoFlujo` — `src/tipos.ts` (Base: read-models de la API)
- [ ] **T5: Cliente HTTP fino** — `peticion(baseUrl, metodo, ruta, cuerpo?)` → `{ estado, cuerpo }`; JSON solo si `content-type` lo indica; error de red (API caída) → error tipado con mensaje claro — `src/cliente-api.ts` (Base: `fetch` nativo)

#### Fase 3: Flujo de 7 pasos
- [ ] **T6: Pasos del flujo** — arreglo ordenado `PASOS` con los 7 pasos; cada uno: `numero`, `nombre`, `metodo + ruta` (para el reporte), `verificar(ctx, api)` que devuelve `ResultadoPaso` con esperado vs real: P1 `POST /cuentas` → 201 + `id` numérico (captura `ctx.cuentaId`) · P2 `GET /cuentas/{id}` → 200 + `id`/`descripcion` coinciden · P3 `POST /notas` (credito, monto > 0) → 201 + `id` (captura `ctx.notaId`) · P4 `POST /notas` (monto 0) → 400 + `{error}` (el rechazo es lo esperado) · P5 `PUT /notas/{id}` (debito, monto nuevo, descripción nueva) → 200 + valores actualizados · P6 `DELETE /notas/{id}` → 204 sin cuerpo + `GET` → 404 · P7 `DELETE /cuentas/{id}` → 204 + `GET` → 404 — `src/pasos.ts` (Base: `cuentas-webapi/docs/http/notas.http`)
- [ ] **T7: Orquestador + reporte** — ejecución secuencial fail fast; por paso imprime `Paso N — nombre — MÉTODO ruta — esperado X → real Y — ✅/❌`; al final `X/7 pasos exitosos`; `process.exit(0)` si 7/7, `process.exit(1)` en el primer fallo (incluida API caída, con detalle del paso fallido); resumen final al stdout — `src/index.ts` (Base: AC Escenario 8)

#### Fase 4: Verificación DoD
- [ ] **T8: Ejecutar DoD completa** — arrancar API (`. .\.dev-env.ps1; npm run dev` en `cuentas-webapi`), correr `npm run dev` en `cuentas-cli` → 7/7 exitosos con exit 0; verificar fail fast con API apagada → exit 1 con paso fallido; verificar compilación `npm run build` limpia; (opcional) confirmar en BD las filas `estado = 0` — (Base: DoD de `historia.md`, coding-standards §6)
