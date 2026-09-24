# Contexto del Proyecto

<!-- SECTION:ARCHITECTURE -->
- Sistema: cuentas-webapi — Web API CRUD de cuentas financieras + notas débito/crédito (PoC curso Node.js).
- Stack: Node ≥24 ESM (`"type":"module"`), `node:http` nativo (sin frameworks), `mssql` v12 (API promesa, `await`).
- Obligatorio: hexagonal + DDD + CQRS mínimo — capas: `src/index.js` (composition root), `src/interfaces/http/`, `src/application/{cuentas,notas}/` (commands/queries/ports), `src/domain/`, `src/data/`.
- `domain/` NUNCA importa HTTP ni `mssql`; invariantes (descripción no vacía, tipo débito|crédito, monto > 0) en las entidades, lanzan errores tipados.
- Puertos definidos en `application/`; repositorios MSSQL en `data/`; DI manual en el composition root.
- Router manual sobre `node:http`; `readJson(req)` en promesa; handlers `async`.
- Eliminación lógica: `DELETE` → `UPDATE estado=0` → 204; nunca `DELETE` físico; eliminado = 404.
- Errores siempre JSON `{error}`: 400 validación · 404 no existe/eliminado · 405 método (`Allow`) · 500 BD.
- MSSQL local pre-existente (prerrequisito manual); conexión por env `MSSQL_USER`/`MSSQL_PASS`/`MSSQL_CONNECTION` — nunca hardcodear credenciales.
- Prohibido: frameworks, `util.promisify` (usar APIs promesa nativas), dependencias nuevas distintas de `mssql`, autenticación, UI.
<!-- END:ARCHITECTURE -->
