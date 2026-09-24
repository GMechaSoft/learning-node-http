# 🚀 Development Handoff: Arquitectura base (GPS) — Web API de cuentas financieras (PoC Node.js)

**Date:** 2026-09-24  
**Repository Branch:** master (último commit `7e98289` "historia de usuario"; cambios de arquitectura **sin commit**)

---

## 🎯 1. Objective
Definir la **arquitectura base** (fase Arquitecto del Método Ceiba) antes de implementar cualquier código: GPS arquitectónico ejecutivo con decisiones D1–D11 para la **Web API de cuentas financieras + notas débito/crédito** (CRUD, persistencia MSSQL local). Incluye el requisito PO agregado en sesión: la implementación debe usar **DDD + arquitectura hexagonal + CQRS mínimo** con capas de aplicación, dominio y datos (repositorios).

Contexto previo (fase PO, ya commitada en `7e98289`): historias `#1` (padre, sliceada), `1.1` (CRUD cuentas, 7 ACs) y `1.2` (CRUD notas, 5 ACs). NFRs: Node ≥ 24 sin frameworks (`node:http` nativo), ESM, `async/await` + APIs promesa (sin `util.promisify`), errores JSON `400`/`404`/`405`, eliminación lógica por cambio de estado, sin auth/UI.

## 📊 2. Current Status
- **Status:** In Progress
- **Fase Arquitecto COMPLETADA y confirmada por el usuario**: GPS generado, revisado (2 vueltas) y aprobado en `docs/architecture/index.md`; contexto IA generado en `.github/copilot-instructions.md` (§ARCHITECTURE).
- Sin código de implementación todavía: `src/index.js` sigue vacío; `package.json` aún en su estado previo (commonjs, sin deps) — las correcciones quedaron como decisiones D1/D2 pendientes de aplicar.
- Working tree: `docs/architecture/index.md` modificado, `.github/copilot-instructions.md` nuevo (⚠️ **gitignoreado** — ver sección 5), `handoff.md` untracked, `.gitignore` modificado (cambio previo a esta sesión: exclusiones de skills del método).

## 🗂️ 3. Files in Progress
- `docs/architecture/index.md`
- `.github/copilot-instructions.md`
- `handoff.md`
- `.gitignore` (cambio no de esta sesión)

## 🛠️ 4. Changes Made
- **GPS arquitectónico** (`docs/architecture/index.md`): reemplaza el estado "sin definir". Contiene: resumen ejecutivo y límites; diagrama de alto nivel (Mermaid) con las 4 capas hexagonales; modelo de datos (erDiagram) + **DDL de referencia** (tablas `cuentas`/`notas`, columna `estado BIT`, `CHECK` de tipo/monto, FK sin `ON DELETE`); stack validado contra máquina (Node v24.21.0 real; `mssql` 12.7.2 en npm); integraciones (HTTP JSON + TDS); contrato de errores.
- **11 decisiones de arquitectura (D1–D11)**: D1 ESM `type:module` + `.js` · D2 `mssql ^12` + `engines ^24.21` + script `dev` corregido a `node --watch src/index.js` · D3 estructura `src/` hexagonal: `index.js` (composition root), `interfaces/http/`, `application/{cuentas,notas}/` (commands/queries/ports), `domain/`, `data/` · D4 conexión BD por env (`MSSQL_USER`/`MSSQL_PASS`/`MSSQL_CONNECTION`, default localhost:1433) · D5 eliminación = `DELETE` → `204`, operación `UPDATE estado` · D6 IDs `INT IDENTITY` · D7 `405` solo en ruta existente (con `Allow`), `404` en inexistente/eliminado · D8 CHECKs + FK en DDL · D9 pool connect en arranque / close en SIGTERM / 500 JSON · D10 CQRS mínimo (commands/queries por recurso, DI manual, sin bus de eventos) · D11 invariantes en el dominio con errores tipados que el adapter traduce a HTTP.
- **Contexto IA** (`.github/copilot-instructions.md`): sección `<!-- SECTION:ARCHITECTURE -->` (≈270 tokens) con las reglas duras: capas obligatorias, `domain/` nunca importa HTTP ni `mssql`, puertos en `application/` implementados en `data/`, prohibiciones (frameworks, `util.promisify`, deps nuevas, auth, UI).
- **Discrepancias documentado↔código** detectadas y resueltas como decisiones: `package.json` con `type=commonjs` (NFR pide ESM), sin dependencias (`mssql` ausente), sin `engines`, script `dev` auto-referencial (`npm run dev` → bucle).

## ⚠️ 5. Attempts and Failures
- **Attempt:** Crear `docs/architecture/index.md` con `create_file` (contenido nuevo completo).
  - *Result:* Falló — el archivo ya existía (estado "sin definir" con decisiones PO).
  - *Resolución:* reescrito vía reemplazo del bloque completo con `replace_string_in_file`; verificado por relectura.
- **Attempt (sesión PO previa):** Invocar subagente INVEST enmarcado como agente del método → rechazado; re-invocado como análisis neutro → OK (INVEST 51/60, cobertura 9/9).
- **Attempt (sesión PO previa):** Persistir `scope_continuity_findings` en `medicion/decisionRegistry.mjs` → módulo inexistente en esta instalación; hallazgos documentados en prosa ("Alcance y Continuidad" de cada `historia.md`).
- **⚠️ Hallazgo:** `.gitignore` línea 8 ignora `.github/` — por tanto `.github/copilot-instructions.md` **no queda versionado** (no aparece en `git status` ni es trackeable sin `git add -f`). Si el contexto IA debe compartirse, excluir `copilot-instructions.md` del ignore o moverlo.
- Nota: `git` del repositorio está un nivel arriba del workspace (paths con prefijo `cuentas-webapi/`).

## 🔮 6. Next Steps (Upcoming Tasks)
1. 🔲 Commitar los cambios de arquitectura (`docs/architecture/index.md`, `handoff.md`, y decidir el tratamiento de `.github/copilot-instructions.md` según el gitignore).
2. 🔲 Preparar/estimar **US-001.1** con `ceiba-preparar-historia` (o `ceiba-dev-rapido`): refinamiento técnico + medición CFP COSMIC (hoy `Pendiente`) en `docs/stories/1.1-crud-cuentas-financieras/` — el análisis arquitectónico ya está cubierto por el GPS.
3. 🔲 Aplicar D1/D2 a `package.json`: `"type":"module"`, `dependencies.mssql ^12`, `engines.node ^24.21`, `scripts.dev = "node --watch src/index.js"`; luego `npm install`.
4. 🔲 Prerrequisito manual del usuario: crear BD local en MSSQL Server (puerto 1433) con el **DDL de referencia del GPS** (tablas `cuentas`, `notas`) y usuario de conexión; exportar `MSSQL_USER`/`MSSQL_PASS` (o `MSSQL_CONNECTION`).
5. 🔲 Implementar US-001.1 sobre la estructura D3: `src/index.js` (composition root + router), `src/interfaces/http/` (adapter, `readJson`), `src/application/cuentas/` (commands/queries/ports), `src/domain/` (entidad Cuenta + errores), `src/data/` (pool + repositores MSSQL); endpoints `/cuentas` + `/cuentas/{id}` con ACs 1–7.
6. 🔲 Verificación manual de la DoD de 1.1 con un cliente HTTP (p. ej. `.http` de VS Code): crear/consultar/actualizar/eliminar cuenta + eliminación lógica confirmada en la BD (registro permanece con `estado=0`).
7. 🔲 Reiterar el ciclo (2→6) para **US-001.2** (CRUD notas): regla 404 "nota requiere cuenta existente (y activa)", `tipo ∈ {debito, credito}`, monto numérico positivo.
