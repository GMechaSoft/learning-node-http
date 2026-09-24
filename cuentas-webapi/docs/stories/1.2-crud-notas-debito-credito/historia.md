# Historia de Usuario

**Como** usuario del curso de Node.js,
**Quiero** registrar y gestionar notas débito y crédito asociadas a cuentas existentes mediante la Web API,
**Para** completar la gestión financiera y validar como prueba de concepto HTTP nativo, validación de requests y persistencia con Node.js sin frameworks.

## Descripción

Web API para la gestión de notas débito y crédito (CRUD completo). Cada nota pertenece a una cuenta existente y se identifica por su id; tiene un tipo (`debito` o `credito`), un monto numérico positivo y una descripción. Los datos se registran y recuperan de una base de datos MSSQL Server local pre-existente, con un único usuario de conexión.

No existe gestión de usuarios, roles, autenticación ni tokenización. El proyecto es una prueba de concepto de un curso de Node.js: no requiere rigurosidad extrema.

Esta historia es el **segundo slice** de la historia padre `1-gestion-cuentas-financieras` y cubre SOLO el recurso de notas. La hermana `1.1` cubre el CRUD de cuentas, sobre el que esta historia depende únicamente para la regla de "nota requiere cuenta existente".

Entidad:

- **Nota**: id (identificador), cuenta (referencia a la cuenta existente), tipo (`debito` o `credito`), monto (numérico positivo), descripción, estado (activa/eliminada).

El saldo NO se almacena ni se calcula: la historia cubre únicamente el CRUD plano de notas.

---

## Criterios de Aceptación

### Escenario 1: Crear nota débito o crédito

- **Dado** que existe una cuenta registrada
- **Cuando** se envía una solicitud `POST` para crear una nota con: la cuenta existente, tipo `debito` o `credito`, monto numérico positivo y descripción
- **Entonces** la API responde con código `201` e identifica la nota creada
- **Y** la nota queda registrada en la base de datos asociada a la cuenta

### Escenario 2: Consultar, actualizar y eliminar notas

- **Dado** que existen notas registradas
- **Cuando** se envían solicitudes `GET` (todas o por id), `PUT` con datos válidos, o de eliminación
- **Entonces** la API responde `200` con los datos o la confirmación, y el estado persistido cambia en consecuencia
- **Y** la eliminación de una nota es lógica: cambio de estado, sin borrado físico; la nota eliminada no figura en las consultas
- **Y** si la nota no existe (o está eliminada lógicamente), la API responde `404`

### Escenario 3: Nota sin cuenta existente

- **Dado** que la cuenta indicada no existe en la base de datos
- **Cuando** se envía una solicitud `POST` para crear una nota contra esa cuenta
- **Entonces** la API responde `404` indicando que la cuenta no existe
- **Y** no se registra ninguna nota

### Escenario 4: Body o formato inválido

- **Dado** que la API recibe una solicitud `POST` o `PUT` sobre notas
- **Cuando** el body no es JSON válido, falta el `Content-Type: application/json`, o faltan/cumplen mal los campos obligatorios (tipo diferente de `debito`/`credito`, monto no numérico o no positivo, descripción vacía)
- **Entonces** la API responde `400` con un cuerpo JSON que indica el error

### Escenario 5: Método HTTP no soportado

- **Dado** que existe un endpoint para notas
- **Cuando** se envía una solicitud con un método no soportado sobre ese endpoint
- **Entonces** la API responde `405` indicando que el método no está permitido

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** Usuario genérico del curso (consumidor único de la API, sin roles)
- **Permisos requeridos:** Ninguno — sin autenticación, sin tokenización
- **Valor de negocio:** Prueba de concepto de un curso de Node.js: practicar HTTP nativo, validación de requests y persistencia en MSSQL

### Reglas de Negocio

- Una nota siempre pertenece a una cuenta existente; no se puede crear nota contra cuenta inexistente.
- Una cuenta eliminada lógicamente no admite notas nuevas (se trata como inexistente).
- La eliminación de notas es lógica (cambio de estado): el registro no se borra físicamente; una nota eliminada no figura en listados ni consultas por id.
- El tipo de nota es exclusivamente `debito` o `credito`.
- El monto de una nota debe ser numérico y positivo.
- Nota mínima: id, cuenta, tipo, monto, descripción.
- No se calcula ni almacena saldo: solo CRUD plano.
- Sin usuarios, roles, autenticación ni tokenización.
- Un único usuario de conexión a la base de datos (sin complejidades de acceso).

### Requisitos No Funcionales

- Node.js básico, sin frameworks: módulo `http` nativo del protocolo HTTP.
- **Node.js ≥ 24 (base `^24.21`)**: usar las técnicas estables más recientes; evitar técnicas deprecadas.
- Manejo asíncrono con `async/await` en lugar de callbacks.
- Preferir las APIs basadas en promesas de los módulos nativos (sufijo `/promise`, p. ej. `node:fs/promises`, `node:readline/promises`); evitar APIs callback y `util.promisify` manual cuando exista la API promesa nativa.
- La API `node:http` es por eventos (callback): encapsular la lectura de requests en promesas (p. ej. un helper `readJson(req)` que devuelve una promesa) y los manejadores de request deben ser `async`.
- Cliente de base de datos: driver con API promesa nativa (p. ej. `mssql`), consumido con `await`, sin callbacks.
- JavaScript `.js` y módulos ESM `.mjs`.
- Validar métodos `POST`, `GET`, `PUT` (y responder `405` para métodos no soportados).
- Validar body, headers (`Content-Type: application/json`) y formato JSON.
- Errores con códigos HTTP estándar y cuerpo JSON: `400` (body/campos inválidos), `404` (recurso no encontrado), `405` (método no permitido).
- Persistencia en MSSQL Server local; la base de datos, tablas y usuario de conexión son **pre-existentes** (prerrequisito manual, fuera del alcance de esta historia).
- Alcance de prueba de concepto: no requiere rigurosidad extrema (sin pruebas automatizadas, logs ni observabilidad como requisitos).

### Interfaz

API REST sobre HTTP. Punto de entrada de este slice (sugerencia, el detalle técnico lo define la arquitectura):

- Notas: `GET /notas`, `GET /notas/{id}`, `POST /notas`, `PUT /notas/{id}`, eliminar nota.

Sin interfaz gráfica: los consumidores son clientes HTTP (por ejemplo, herramientas de API o scripts).

### Sistemas Externos

- **MSSQL Server local**: base de datos pre-existente con un usuario de conexión. Solo se integra (lectura/escritura de datos); NO se crea, gestiona ni provisiona desde esta API.

### Disparadores

- El cliente HTTP envía una solicitud para crear una nota débito o crédito
- El cliente HTTP envía una solicitud para consultar notas (todas o una por id)
- El cliente HTTP envía una solicitud para actualizar una nota
- El cliente HTTP envía una solicitud para eliminar una nota

### Entidades del Dominio

- Nota (el tipo débito/crédito es un atributo de la nota, no una entidad distinta)
- Cuenta (referenciada; su CRUD pertenece a la historia hermana `1.1`)

### Alcance y Continuidad

- Slice derivado de la historia padre `1-gestion-cuentas-financieras` (primera historia del proyecto, implementación de cero; no extiende funcionalidad existente).
- **MSSQL Server local** es un sistema externo fuera del alcance: la API solo se integra con él. La base de datos, las tablas y el usuario de conexión se preparan manualmente como prerrequisito, antes de ejecutar la API.
- Sin autenticación: cualquier cliente puede consumir los endpoints.
- Dependencia declarada sobre la hermana `1.1`: la regla "nota requiere cuenta existente" necesita el recurso de cuentas ya disponible.

### Preview de Interfaz

No aplica — la historia no involucra interfaz gráfica (solo Web API).

---

## Contexto y Referencias

**Arquitectura:** `docs/architecture/index.md` (sin definir aún; el análisis arquitectónico se hará con las historias del slice)
**Historias relacionadas:** Padre: `1-gestion-cuentas-financieras` · Hermana: `1.1` (CRUD de cuentas financieras)
**Lecciones aprendidas:** Sin registro previo

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente (métodos, body, headers, formato JSON)
- [ ] Mensajes implementados (errores JSON con códigos HTTP estándar)
- [ ] Persistencia en MSSQL local verificada manualmente (crear, consultar, actualizar, eliminar notas)
- [ ] Eliminación lógica verificada (cambio de estado; el registro permanece en la base de datos)
- [ ] Regla "nota requiere cuenta existente" verificada (404 contra cuenta inexistente)
- [ ] Requisitos no funcionales cumplidos: Node.js sin frameworks, `.js`/`.mjs`, protocolo `http` nativo, técnicas modernas Node ≥ 24 (`async/await`, sin callbacks, APIs promesa)
