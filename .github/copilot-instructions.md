# Contexto del Proyecto

Workspace con 2 proyectos (PoC curso Node.js, Método Ceiba):

- `cuentas-webapi/` — Web API CRUD de cuentas financieras + notas débito/crédito. **Completada** (historias 1.1 y 1.2, DoD verificada). Instrucciones detalladas: `cuentas-webapi/AGENTS.md`.
- `cuentas-cli/` — CLI TypeScript que consume la API: flujo de integración de 7 pasos, fail fast. **Completada** (HU 2, DoD verificada 7/7).

## Estado actual

- Cuentas y notas implementadas y probadas; CLI HU 2 implementada y la DoD corrió contra la API en vivo (7/7, exit 0).
- Todas las historias (1.1, 1.2, 2) quedan `SIN_MEDICION` hasta generar la strategy (`/ceiba-generar-strategy`) y medir con `ceiba-medir-historia`.

<!-- SECTION:ARCHITECTURE -->
### cuentas-webapi

- Stack: Node ≥24 ESM (`"type":"module"`), `node:http` nativo (sin frameworks), `mssql` v12 (API promesa, `await`).
- Obligatorio: hexagonal + DDD + CQRS mínimo — capas: `src/index.js` (composition root), `src/interfaces/http/`, `src/application/{cuentas,notas}/` (commands/queries/ports), `src/domain/`, `src/data/`.
- `domain/` NUNCA importa HTTP ni `mssql`; invariantes (descripción no vacía, tipo débito|crédito, monto > 0) en las entidades, lanzan errores tipados.
- Puertos definidos en `application/`; repositorios MSSQL en `data/`; DI manual en el composition root.
- Router manual sobre `node:http`; `readJson(req)` en promesa; handlers `async`.
- Eliminación lógica: `DELETE` → `UPDATE estado=0` → 204; nunca `DELETE` físico; eliminado = 404.
- Errores siempre JSON `{error}`: 201 + `{id}` creación · 200 lectura/actualización · 400 validación · 404 no existe/eliminado · 405 método (`Allow`) · 500 BD.
- MSSQL local pre-existente (prerrequisito manual, DDL en `cuentas-webapi/docs/sql/`); conexión por env: `MSSQL_CONNECTION` (cadena completa) **o** `MSSQL_USER`/`MSSQL_PASS` (+ opcionales `MSSQL_SERVER`, `MSSQL_PORT`, `MSSQL_DATABASE`); `PORT` default 3000 — nunca hardcodear credenciales.
- Fail fast: si la BD no conecta, la API no arranca (no sirve tráfico).
- Prohibido: frameworks, `util.promisify` (usar APIs promesa nativas), dependencias de runtime distintas de `mssql`, autenticación, UI.

### cuentas-cli

- Stack: Node ≥24 ESM + **TypeScript** (`tsconfig`: NodeNext, ES2022, `strict`), **cero dependencias de runtime** — HTTP con `fetch` nativo; `typescript`/`tsx`/`@types/node` solo en `devDependencies`.
- Las restricciones de la API aplican al CLI (sin frameworks, Node puro, cero deps de runtime); la única excepción permitida es TypeScript (decisión PO).
- `CUENTAS_API_BASE` (default `http://localhost:3000`) — nunca hardcodear la URL.
- Estructura fija: `config.ts` (env) · `tipos.ts` (modelos) · `cliente-api.ts` (`peticion()` + `ErrorRed`) · `pasos.ts` (los 7 pasos con verificación estado+cuerpo) · `index.ts` (orquestador fail fast, exit 0 con 7/7, exit 1 en el primer fallo).

<!-- END:ARCHITECTURE -->

## Contrato HTTP (sincronización entre proyectos)

- Read-models: cuenta `{id, descripcion}`; nota `{id, cuentaId, tipo, monto, descripcion}`.
- Estados: POST `201` + `{id}` · GET/PUT `200` · 400 validación · 204 sin cuerpo (DELETE) · 404 eliminado/no existe.
- **Al cambiar el contrato de la API** (estados, read-models, rutas) sincronizar SIEMPRE `cuentas-cli/src/pasos.ts`, su `README.md` y el payload esperado del paso 4 (el `400` ES lo esperado allí).

## Ejecución y DoD

1. BD: MSSQL local con `cuentas_webapi` (tablas `cuentas`/`notas`) — prerrequisito manual; la API no provisiona nada.
2. API: en `cuentas-webapi/` → `. .\.dev-env.ps1` (copiar de `.dev-env.example.ps1`, gitignored) → `npm run dev` (`node --watch`).
3. DoD: en `cuentas-cli/` → `npm run dev` → `7/7 exitosos` y exit 0; API apagada → exit 1. Alternativa manual: `cuentas-webapi/docs/http/*.http` o colecciones Insomnia (`insomnia-cuentas-webapi*.yaml`).
4. Verificación en BD (manual, opcional): filas eliminadas con `estado=0`.

## Referencias

- GPS arquitectónico: `cuentas-webapi/docs/architecture/index.md` · estándares de código: `cuentas-webapi/docs/architecture/coding-standards.md`.
- Historias: `cuentas-webapi/docs/stories/` (1 padre → 1.1, 1.2) y `cuentas-cli/docs/stories/2-cli-flujo-integracion/` — cada una con `historia.md`, `refinamiento.md`, `dev-record.md`, `cambios.md`.
- Workflow de desarrollo: Método Ceiba Dev-Rápido (`.github/prompts/ceiba-dev-rapido.prompt.md`).
- Consulta a la BD: tools MCP `mssql_*` de VS Code con perfiles guardados (skill `custom-vscode-mssql-mcp-connect`); predeterminar a lecturas, confirmar escrituras con el usuario.
