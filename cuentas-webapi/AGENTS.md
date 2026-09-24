# Instrucciones para Agentes AI

## Contexto del Proyecto

- **Sistema**: `cuentas-webapi` — Web API CRUD de cuentas financieras + notas débito/crédito (PoC curso Node.js). Persistencia MSSQL local.
- **Stack**: Node ≥ 24 (`^24.21`) ESM (`"type": "module"`), `node:http` nativo (sin frameworks), `mssql` v12 (API promesa nativa, `await`).
- **Arquitectura obligatoria** (GPS completo en `docs/architecture/index.md`, estándares en `docs/architecture/coding-standards.md`):
  - Hexagonal + DDD + CQRS mínimo: `src/index.js` (composition root, único lugar de ensamblaje) → `src/interfaces/http/` (adapter) → `src/application/{cuentas,notas}/` (commands/queries/ports) → `src/domain/` (entidades + invariantes + errores tipados) → `src/data/` (pool singleton + repositorios MSSQL).
  - `domain/` **nunca** importa HTTP ni `mssql`. Invariantes de negocio en las entidades: descripción no vacía, tipo ∈ {debito, credito}, monto > 0.
  - Puertos definidos en `application/`; DI manual en el composition root. Router manual sobre `node:http`; `readJson(req)` en promesa; handlers `async`.
- **Contrato HTTP**: 201 + `{id}` (creación) · 200 (lectura/actualización) · 400 (validación) · 404 (no existe **o eliminado lógicamente**) · 405 (método en ruta existente, header `Allow`) · 500 (BD/imprevisto). Errores siempre JSON `{ "error": "..." }`.
- **Eliminación lógica**: `DELETE` → `UPDATE estado = 0` → 204 sin cuerpo. Nunca `DELETE` físico sobre los datos.
- **Prohibido**: frameworks, `util.promisify` (usar APIs promesa nativas), dependencias de runtime distintas de `mssql`, autenticación, UI, hardcodear credenciales.

## Ejecución

1. **Prerrequisito BD (manual)**: MSSQL local con la BD `cuentas_webapi` y tablas `cuentas`/`notas` (DDL de referencia: `docs/sql/001-prerrequisito-cuentas.sql` y `docs/sql/002-prerrequisito-notas.sql`). La API no provisiona la BD.
2. **Credenciales por env** (D4): copiar `.dev-env.example.ps1` → `.dev-env.ps1` (gitignored) y llenar `MSSQL_USER`/`MSSQL_PASS`/`MSSQL_DATABASE`. Arranque:
   ```powershell
   . .\.dev-env.ps1
   npm run dev   # node --watch src/index.js → http://localhost:3000
   ```
   También soporta `MSSQL_CONNECTION` (cadena completa) en vez de user/pass, y `PORT` (default 3000).
3. **DoD de cambios** (coding-standards §6): API corriendo + `npm run dev` en el CLI hermano **o** las colecciones `docs/http/*.http` / Insomnia (`insomnia-cuentas-webapi.yaml`, `insomnia-cuentas-webapi-notas.yaml`) pasando los estados esperados. Verificar fail fast: BD caída → la API no arranca (no sirve tráfico).

## Proyecto hermano: `cuentas-cli`

- Repo vecino (`../cuentas-cli`): CLI TypeScript que ejecuta el flujo de integración de 7 pasos contra esta API (fail fast, exit 0 con 7/7, exit 1 con el primer fallo). URL base por env `CUENTAS_API_BASE` (default `http://localhost:3000`).
- **Al cambiar el contrato HTTP de esta API** (estados, read-models, rutas) hay que sincronizar `cuentas-cli/src/pasos.ts` y su README — su DoD corrió contra el contrato actual (201/200/400/204/404, read-models `{id, descripcion}` y `{id, cuentaId, tipo, monto, descripcion}`).

## Historias y documentacion

- Historias: `docs/stories/1-gestion-cuentas-financieras/` (padre) → `1.1-crud-cuentas-financieras/` (completada) y `1.2-crud-notas-debito-credito/` (completada). En cada carpeta: `historia.md`, `refinamiento.md`, `dev-record.md`, `cambios.md`.
- El workflow de desarrollo es **Dev-Rápido del Método Ceiba** (`.github/prompts/ceiba-dev-rapido.prompt.md`); las historias 1.1/1.2 y la HU 2 del CLI quedan `SIN_MEDICION` hasta generar la strategy (`/ceiba-generar-strategy`).

## Conexión a SQL Server (skill `custom-vscode-mssql-mcp-connect`)

Guía genérica para conectar y consultar bases de datos SQL Server usando las herramientas MCP nativas `mssql_*` de VS Code (extensión Microsoft SQL Server). Aplica a cualquier base de datos del proyecto: la conexión se resuelve siempre a partir de los perfiles guardados en la extensión (no requiere MCP server externo, `npx` ni `.mcp.json`).

### Perfil de conexión
- Los perfiles se guardan en la extensión SQL Server; listar los disponibles con `mssql_list_servers` (devuelve `{ profileId, profileName, server, database }`).
- **Nunca** pedir, capturar ni mostrar contraseñas: las credenciales viven en el perfil guardado de la extensión y no deben aparecer en la conversación ni en archivos compartidos.
- SQL Server local (instancia o contenedor Docker): antes de conectar verificar que el puerto esté abierto (`Test-NetConnection localhost -Port 1433`). Un "connection refused" casi siempre es el servicio apagado, no un error de credenciales.

### Flujo
1. `mssql_list_servers` → lista de perfiles disponibles.
   - Si la lista está vacía: guiar al usuario a crear un perfil (vista **SQL Server** en la activity bar → *New Connection* → servidor, autenticación, credenciales → guardar) y no continuar hasta que al menos un servidor aparezca.
2. `mssql_connect(serverName=...)`:
   - El `serverName` debe salir siempre del valor exacto de `server` retornado por `mssql_list_servers` (el tool valida contra perfiles registrados; un nombre inventado falla).
   - `database` solo si el usuario la mencionó; `profileId` solo si el usuario nombró el perfil explícitamente ("conectar usando el perfil X").
   - Si el `database` indicado no existe y la conexión falla: reconectar sin database y usar `mssql_list_databases` para encontrar el nombre correcto.
   - Guardar el `connectionId` (UUID) retornado: lo necesitan todas las herramientas siguientes.
3. Verificar: `mssql_get_connection_details(connectionId)` (server, database, autenticación, user) y `mssql_list_databases(connectionId)`.
4. Explorar el esquema: `mssql_list_tables`, `mssql_list_schemas`, `mssql_list_views`, `mssql_list_functions`. Cambiar de base de datos con `mssql_change_database(connectionId, database)` (mostrar antes `mssql_list_databases` como opciones).
5. Consultar: `mssql_run_query(query, queryTypes, queryIntent)`:
   - Predeterminar a lectura (SELECT, EXPLAIN, sys.*, INFORMATION_SCHEMA).
   - Usar `TOP` en tablas anchas para no saturar el contexto.
   - Operaciones de escritura (INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE): mostrar la sentencia y obtener confirmación explícita del usuario. UPDATE/DELETE sin `WHERE` requiere confirmación doble. No ejecutar DDL destructivo sin confirmación.
6. `mssql_disconnect(connectionId)` al terminar para no dejar sesiones abiertas.

### Gotchas
- `schema` es palabra reservada en T-SQL: usar alias `[schema]` (de lo contrario falla con `Msg 156`).
- `mssql_schema_designer`: para abrirlo con una conexión MCP, pasar el UUID de `mssql_connect` en el campo **`connectionName`** (nunca en `connectionId`, que es para el runtime de VS Code). Toda mutación del designer exige `expectedVersion` del último `get_overview`/`get_table`.
- Fuera de VS Code estas herramientas no existen: derivar a `sqlcmd` o a un MCP server externo (skill `custom-database-mcp-setup`).
