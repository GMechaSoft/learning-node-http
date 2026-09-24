# Instrucciones para Agentes AI

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
