# Registro de Cambios — Historia #1.2

| Fecha | Fase | Descripción | Autor |
|-------|------|-------------|-------|
| 2026-09-24 | Creación | Historia creada (slice 2 de `1-gestion-cuentas-financieras`) | Gerson Sanchez (PO) |
| 2026-09-24 | Ajuste alcance | Decisión PO: eliminación lógica (cambio de estado), sin borrado físico | Gerson Sanchez (PO) |
| 2026-09-24 13:11 | Cierre creación | Checklist completo, cobertura de slicing aprobada, métricas registradas | Gerson Sanchez (PO) |
| 2026-09-24 13:11 | Tracker | Sin tablero de gestión (desarrollo directo); sprint omitido | Gerson Sanchez (PO) |
| 2026-09-24 | Ajuste NFR | Decisión PO: técnicas modernas Node.js ≥ 24 (^24.21) — async/await en vez de callbacks, APIs promesa (sufijo /promise), evitar técnicas deprecadas | Gerson Sanchez (PO) |
| 2026-09-24 15:29 | Plan | Refinamiento técnico (14 tareas, patrón 1.1 reutilizado 1:1) generado y aprobado por el usuario | Gerson Sanchez (Developer) |
| 2026-09-24 15:38 | Medición | Rescate de medición step-02 §1b: prelude HALT exit 3 `STRATEGY_NOT_APPROVED` (no existe `measurement-strategy.json`) → `preparacion_lanzada = false`; se mide al cierre con `medir-historia` (requiere `/ceiba-generar-strategy`) | Gerson Sanchez (Developer) |
| 2026-09-24 15:50 | Cierre desarrollo | DoD verificada 22/22 contra API en vivo + eliminación lógica confirmada en BD (estado=0) + regresión 1.1 limpia; tabla `notas` provisionada; mecanismo de credenciales `.dev-env.ps1` gitignored | Gerson Sanchez (Developer) |
| 2026-09-24 | Dev-Rápido | ⚡ Implementado: CRUD de notas débito/crédito (5 endpoints, regla cuenta existente, eliminación lógica; DoD 22/22) | Gerson Sanchez |
| 2026-09-24 16:07 | Vigencia | GUARD COSMIC: `SIN_MEDICION` (cosmic_vigente=false, hash actual sha256:863523…) · GUARD PNF: `SIN_MEDICION` (pnf_vigente=false) → encadena `medir-historia` | Gerson Sanchez (Developer) || 2026-09-24 16:08 | Medición | Intento de medición COSMIC/PNF HALT: `PENDING_STRATEGY/STRATEGY_NOT_APPROVED` ("No existe measurement-strategy.json"); intento `20260924210756-53fc761c` cerrado con ese estado, artefactos oficiales intactos — se requiere `/ceiba-generar-strategy` y luego `ceiba-medir-historia` (mismo antecedente que 1.1) | Gerson Sanchez (Developer) |