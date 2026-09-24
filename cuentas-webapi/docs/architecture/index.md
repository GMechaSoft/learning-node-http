# Arquitectura — cuentas-webapi

> Estado: **sin definir**. Proyecto en fase de prueba de concepto (curso Node.js).
> La arquitectura se documentará por el agente Arquitecto cuando exista la historia de usuario aceptada.

## Decisiones de contexto conocidas (PO)

- Web API de gestión de cuentas financieras con notas débito/crédito (CRUD).
- Persistencia en MSSQL Server local.
- Sin usuarios, roles, autenticación ni tokenización.
- Stack: Node.js básico sin frameworks (protocolo http nativo), JavaScript `.js` / ESM `.mjs`.
- Node.js ≥ 24 (base `^24.21`): técnicas estables más recientes — `async/await` en vez de callbacks, APIs basadas en promesas de los módulos nativos (sufijo `/promise`), evitar técnicas deprecadas.
