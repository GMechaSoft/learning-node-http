# cuentas-webapi

Web API CRUD de **cuentas financieras** y **notas débito/crédito** que persiste en MSSQL Server local. Es una **prueba de concepto de un curso de Node.js**: HTTP nativo sin frameworks, validación de requests y persistencia (HU 1.1 y 1.2, completadas).

## Stack

- Node.js ≥ 24 (`^24.21`), ESM (`"type": "module"`)
- `node:http` nativo — **sin frameworks** (router manual + `readJson` en promesa)
- `mssql` v12 (API promesa nativa, `await`) — única dependencia de runtime
- Arquitectura: **hexagonal + DDD + CQRS mínimo** (GPS completo en [docs/architecture/index.md](docs/architecture/index.md), estándares en [docs/architecture/coding-standards.md](docs/architecture/coding-standards.md))

## Requisitos previos

1. Node.js ≥ 24 instalado.
2. **MSSQL Server local** (localhost:1433) con la BD `cuentas_webapi` y las tablas `cuentas`/`notas`. **La API no provisiona la BD** — el DDL de referencia está en:
   - [docs/sql/001-prerrequisito-cuentas.sql](docs/sql/001-prerrequisito-cuentas.sql)
   - [docs/sql/002-prerrequisito-notas.sql](docs/sql/002-prerrequisito-notas.sql)

## Instalación y arranque

```powershell
npm install

# 1. Credenciales (una sola vez): copiar la plantilla y llenar los valores
Copy-Item .dev-env.example.ps1 .dev-env.ps1   # luego editar .dev-env.ps1 (gitignored)

# 2. Arranque
. .\.dev-env.ps1
npm run dev   # node --watch src/index.js → http://localhost:3000
```

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MSSQL_USER` / `MSSQL_PASS` | — | Usuario/contraseña del SQL Server (D4) |
| `MSSQL_CONNECTION` | — | Alternativa: cadena de conexión completa (reemplaza user/pass) |
| `MSSQL_SERVER` | `localhost` | Servidor SQL |
| `MSSQL_PORT` | `1433` | Puerto SQL |
| `MSSQL_DATABASE` | — | Nombre de la BD (p. ej. `cuentas_webapi`) |
| `PORT` | `3000` | Puerto de la API |

Las credenciales **nunca** se hardcodean. **Fail fast**: si la BD no está disponible al arrancar, la API no sirve tráfico (error de arranque, exit 1).

## Endpoints

| Método | Ruta | Éxito | Errores |
|--------|------|-------|---------|
| `GET` | `/cuentas` | `200` + arreglo de cuentas activas `{ id, descripcion }` | — |
| `POST` | `/cuentas` | `201` + `{ "id" }` | `400` validación |
| `GET` | `/cuentas/{id}` | `200` + cuenta | `400` id inválido · `404` no existe/eliminado |
| `PUT` | `/cuentas/{id}` | `200` + cuenta actualizada | `400` · `404` |
| `DELETE` | `/cuentas/{id}` | `204` sin cuerpo (eliminación lógica) | `404` |
| `GET` | `/notas` | `200` + arreglo de notas activas `{ id, cuentaId, tipo, monto, descripcion }` | — |
| `POST` | `/notas` | `201` + `{ "id" }` | `400` · `404` cuenta inexistente |
| `GET` | `/notas/{id}` | `200` + nota | `400` · `404` |
| `PUT` | `/notas/{id}` | `200` + nota actualizada | `400` · `404` |
| `DELETE` | `/notas/{id}` | `204` sin cuerpo (eliminación lógica) | `404` |

### Reglas de negocio (invariantes del dominio)

- Cuenta: `descripcion` no vacía (se normaliza con `trim`).
- Nota: `cuentaId` entero positivo, `tipo` ∈ {`debito`, `credito`}, `monto` numérico **> 0**, `descripcion` no vacía; la cuenta referenciada debe existir y estar activa.
- **Eliminación lógica**: `DELETE` ejecuta `UPDATE estado = 0` (nunca `DELETE` físico); un recurso eliminado responde `404` en lecturas posteriores.

### Errores (siempre JSON)

| Código | Significado |
|--------|-------------|
| `400` | Validación: body no JSON, `Content-Type` incorrecto, campos inválidos → `{ "error": "..." }` |
| `404` | Recurso no existe **o fue eliminado lógicamente** |
| `405` | Método no soportado en ruta existente (header `Allow`) |
| `500` | Fallo de BD / imprevisto |

Ejemplos de peticiones: [docs/http/cuentas.http](docs/http/cuentas.http) · [docs/http/notas.http](docs/http/notas.http) · colecciones Insomnia en `docs/http/`.

## Estructura

```
cuentas-webapi/
├── package.json              # ESM, mssql ^12, engines ^24.21
├── src/
│   ├── index.js              # Composition root: DI manual pool → repos → use cases → router + server
│   ├── interfaces/http/      # Adapter: router manual, readJson, cuentas.js, notas.js, errores → HTTP
│   ├── application/
│   │   ├── cuentas/          # CQRS: commands (crear/actualizar/eliminar), queries, ports
│   │   └── notas/            # CQRS: idem para notas
│   ├── domain/               # Entidades Cuenta/Nota + invariantes + errores tipados (sin HTTP ni mssql)
│   └── data/                 # Pool mssql singleton + repositorios MSSQL (implementan los puertos)
└── docs/
    ├── architecture/         # GPS de arquitectura + estándares de codificación
    ├── sql/                  # DDL de referencia (prerrequisito manual)
    ├── http/                 # Colecciones .http / Insomnia
    └── stories/              # Historias 1.1 y 1.2 (Dev-Rápido)
```

**Dependencias apuntan al interior**: `domain/` no importa nada del proyecto; `application/` solo conoce `domain/`; `data/` e `interfaces/` son adaptadores intercambiables. El composition root (`src/index.js`) es el único lugar de ensamblaje.

## Proyecto hermano: `cuentas-cli`

El repo vecino [`cuentas-cli`](../cuentas-cli) ejecuta el **flujo de integración de 7 pasos** contra esta API (fail fast, exit 0 con 7/7, exit 1 con el primer fallo). Es la DoD automatizada: con la API corriendo, `npm run dev` en `cuentas-cli` debe imprimir `7/7 pasos exitosos`.

## Prohibido (restricciones del curso)

Frameworks · `util.promisify` (usar APIs promesa nativas) · dependencias de runtime distintas de `mssql` · autenticación · UI · hardcodear credenciales.
