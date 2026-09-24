# cuentas-webapi - Estándares de Código

## Información General

### Propósito del Documento

Este documento define los estándares de código obligatorios y recomendados para el desarrollo en cuentas-webapi. Garantizan consistencia, legibilidad y mantenibilidad del código.

- **Audiencia**: Desarrolladores, Code Reviewers
- **Última Actualización**: 2026-09-24
- **Estado**: Activo

> **Nota de evidencia**: el proyecto está en fase pre-implementación (`src/index.js` vacío). La evidencia real disponible es `package.json` y el GPS arquitectónico (`docs/architecture/index.md`, decisiones D1–D11). Las categorías sin código aún existente se documentan como regla textual con la marca **(sin ejemplo real disponible)**.

---

## Estándares Obligatorios

### 1. Nomenclatura

#### Variables y Funciones

- `camelCase` para variables, constantes de módulo y funciones.
- Funciones asíncronas: verbo + `async/await` nativo. Prohibido `util.promisify` (GPS: NFR de APIs promesa).
- (sin ejemplo real disponible — `src/index.js` aún vacío; el patrón queda fijado por las decisiones D1/D9 del GPS).

#### Clases y Componentes

- `PascalCase` para clases, use cases CQRS y errores.
- Use cases: verbo en infinitivo + sustantivo, p. ej. `CrearCuenta`, `ListarCuentas`, `ObtenerCuentaPorId` (D10 del GPS).
- Errores de dominio: `PascalCase` + sufijo `Error`, p. ej. `CuentaNoEncontradaError`, `CampoInvalidoError` (D11 del GPS).
- (sin ejemplo real disponible).

#### Archivos y Directorios

```text
# ✅ CORRECTO — archivos y directorios en minúsculas, sin guiones
src/index.js
src/data/connection.js
src/domain/cuenta.js
src/application/cuentas/ports.js

# ❌ INCORRECTO
src/data/ConnectionPool.js
src/application/CuentaCommands.js
```

- Archivos: `kebab-case` o `camelCase` solo en minúscula; la convención del GPS (D3) usa minúsculas (`connection.js`, `cuenta.js`, `nota.js`, `ports.js`).
- Un archivo = una responsabilidad (una entidad, un puerto, un repositorio, el pool).
- (sin ejemplo real disponible — la estructura se aplica al implementar US-001.1).

### 2. Estructura de Código

#### Organización de Imports

- Solo ESM (`import`/`export`); el proyecto corre con `"type": "module"` (D1). Prohibido `require`.
- Orden: 1) módulos nativos de Node (`node:http`), 2) dependencias externas (`mssql`), 3) capas internas (`domain` → `application`), 4) archivos locales.
- (sin ejemplo real disponible).

#### Estructura de Funciones

- Handlers HTTP y use cases: funciones `async`; la BD se consume con `await` sobre la API promesa de `mssql` (sin callbacks, sin `util.promisify`).
- Un use case = una función `async` que recibe sus dependencias (repositorios) por parámetro — DI manual, sin closures globales (D10).
- (sin ejemplo real disponible).

### 3. Manejo de Errores

- El dominio lanza **errores tipados** (clases `*Error`); el adapter HTTP los traduce a respuestas JSON `{ "error": "..." }`.
- Contrato de estado (D7/D9, contrato de errores del GPS):

| Código | Cuándo |
|---|---|
| `400` | body no es JSON, `Content-Type` no es `application/json`, campos inválidos |
| `404` | recurso no existe **o fue eliminado lógicamente** (`estado = 0`) |
| `405` | método no soportado **en ruta existente** (con header `Allow`) |
| `500` | fallo de BD o error imprevisto |

- El adapter valida solo la **forma** del input; las reglas de negocio las valida el dominio (D11).
- (sin ejemplo real disponible — el contrato está fijado en el GPS; el código llegará con US-001.1).

### 4. Restricciones Arquitectivas de Codificación

#### Respeto de Capas y Responsabilidades

Reglas duras de dependencias (D3/D10 del GPS, `.github/copilot-instructions.md`):

1. `domain/` **nunca** importa `node:http`, `mssql` ni nada de `interfaces/`/`data/`.
2. `application/` solo conoce `domain/` y define los puertos (`ports.js`).
3. `data/` implementa los puertos sobre `mssql`; nunca contiene reglas de negocio.
4. `interfaces/http/` solo orquesta: parsea, llama a commands/queries, traduce errores.
5. El ensamblaje (pool → repositorios → use cases → router) vive **solo** en `src/index.js` (composition root).
6. (sin ejemplo real disponible).

#### Restricciones adicionales

- **Eliminación lógica**: `DELETE` se implementa como `UPDATE estado = 0` → responde `204`. **Nunca** `DELETE` SQL (D5/D8).
- **Credenciales**: solo vía env `MSSQL_USER`/`MSSQL_PASS` o `MSSQL_CONNECTION` (default `localhost:1433`). Nunca hardcodeadas (D4).
- **Pool**: un solo `mssql.ConnectionPool` por proceso en `data/connection.js`; `connect()` al arrancar, `close()` en `SIGTERM` (D9).
- **Prohibido**: frameworks web, `util.promisify`, dependencias de runtime distintas de `mssql`, autenticación, UI.
- **Evidencia real de `package.json`** (estado actual, pendiente de aplicar D1/D2):

```json
// ❌ INCORRECTO — "dev" auto-referencial (bucle infinito) y "type" commonjs (D1 exige ESM)
{
  "type": "commonjs",
  "scripts": { "dev": "npm run dev", "test": "echo \"Error: no test specified\" && exit 1" }
}

// ✅ CORRECTO — objetivo fijado por D2
{
  "type": "module",
  "engines": { "node": "^24.21" },
  "dependencies": { "mssql": "^12" },
  "scripts": { "dev": "node --watch src/index.js" }
}
```

### 5. UI / Design System

N/A — el proyecto no tiene insumos de diseño (Tokens.json/Hoja_Variantes.md) generados todavía.

### 6. Pruebas Unitarias

#### Convención de Testing: sin framework (PoC — verificación manual)

- El proyecto **no usa** framework de pruebas: el límite del sistema excluye pruebas automatizadas (GPS, Resumen Ejecutivo) y el script `test` actual es un placeholder de npm:

```json
// Estado real de package.json hoy
"test": "echo \"Error: no test specified\" && exit 1"
```

- Convención vigente: la DoD de cada historia se verifica **manualmente** con un cliente HTTP (archivo `.http` de VS Code) y consulta directa a la BD para confirmar la eliminación lógica (`estado = 0`).
- La adopción de un framework de pruebas se propone en **Recomendaciones de Evolución** (no es obligatoria hoy).

---

## Convenciones Recomendadas

### 1. Organización de Archivos

```text
src/
├── index.js                  # composition root: DI manual + server + router
├── interfaces/
│   └── http/                 # adapter HTTP: readJson(req), routes por recurso
├── application/
│   ├── cuentas/              # commands.js, queries.js, ports.js
│   └── notas/                # commands.js, queries.js, ports.js (US-001.2)
├── domain/
│   ├── cuenta.js             # entidad + invariantes
│   ├── nota.js               # entidad + invariantes (US-001.2)
│   └── errores.js            # *Error tipados compartidos
└── data/
    ├── connection.js         # pool mssql singleton
    ├── cuenta-repository.js  # implementa application/cuentas/ports.js
    └── nota-repository.js    # (US-001.2)
```

- Separación por recurso: cada historia queda autocontenida en `application/{recurso}/` + entidad + repositorio (D3).

### 2. Patrones de Código

- **Read-model directo**: las queries devuelven objetos simples (DTO plano) mapeados de la fila; el mapeo fila→entidad vive en `data/`, nunca en `application/`.
- **IDs opacos**: `INT IDENTITY`; el `POST` responde `201` con `result.inserted.id` (D6).
- **Fail fast**: si el pool no conecta al arrancar, el proceso no sirve tráfico (D9).
- (sin ejemplo real disponible).

### 3. Convenciones Complementarias para Tests

- Al adoptarse un framework (ver evolución): naming descriptivo `<uso>Cuando<condición>Debe<resultado>`; un solo assertion por comportamiento; dobles de repositorio (objeto literal que implementa el puerto) en lugar de tocar la BD real.

---

## Configuración de Herramientas

### Linter

N/A — el proyecto no tiene linter configurado (sin `.eslintrc*`, `eslint.config.*`, `tsconfig.json` ni `sonar-project.properties`). Estándar básico acordado: sin herramientas de lint en la PoC; las reglas de este documento se aplican por revisión.

### Formatter

N/A — sin Prettier ni `.editorconfig` activos. Convención mínima acordada: 2 espacios de sangría, semicolon presente, comillas simples en JavaScript.

### Scripts

```json
{
  "scripts": {
    "dev": "node --watch src/index.js",
    "lint": "N/A (sin linter configurado)",
    "lint:fix": "N/A (sin linter configurado)",
    "format": "N/A (sin formatter configurado)",
    "test:unit": "N/A (verificación manual DoD con .http)"
  }
}
```

---

## Recomendaciones de Evolución

1. **`node:test` (framework nativo, cero dependencias)**: Node ≥ 24 incluye `node:test` + `node:assert`; es el único camino de pruebas automatizadas compatible con la prohibición de dependencias nuevas distintas de `mssql`. Propuesta: un test por invariante de dominio (las entidades no necesitan BD ni HTTP, son puro JavaScript).
2. **ESLint con flat config**: requiere `eslint` como *devDependency* (no runtime), lo cual toca la regla "sin dependencias nuevas distintas de `mssql`" — aplicar solo si el PO la aprueba; el valor sería validar automáticamente las restricciones de capas (import/restricted-imports por capa).
3. **Prettier**: formato determinista en `devDependencies`; misma salvedad que ESLint.
4. **`.env` con `dotenv` o variables de shell**: hoy la conexión se toma de env; para el día a día del curso conviene documentar un `MSSQL_CONNECTION` de ejemplo en un `.env.example` (sin valores reales) — no agrega dependencias si se usa el env nativo del shell.
5. **Archivo `.http` versionado** por recurso (`docs/http/cuentas.http`) para hacer la verificación manual de la DoD repetible.

---

## Referencias y Recursos

- `docs/architecture/index.md` — GPS arquitectónico (decisiones D1–D11, contrato de errores, DDL de referencia)
- `AGENTS.md` y `.github/copilot-instructions.md` — restricciones para agentes IA (reglas duras de capas y prohibiciones)
- `docs/stories/1.1-crud-cuentas-financieras/historia.md` y `docs/stories/1.2-crud-notas-debito-credito/historia.md` — ACs que estos estándares soportan
- `package.json` — manifest real del proyecto (estado D1/D2 pendiente de aplicar)
- `handoff.md` — estado de la fase Arquitecto y próximos pasos

---

> **Método Ceiba generar-estandares-codigo** v n/d | Usuario: Gerson Sanchez | Fecha: 2026-09-24
