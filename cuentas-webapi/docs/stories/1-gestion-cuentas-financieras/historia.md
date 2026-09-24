# Historia de Usuario

**Como** usuario del curso de Node.js,
**Quiero** gestionar cuentas financieras y sus notas débito/crédito mediante una Web API que persista los datos en MSSQL Server local,
**Para** validar como prueba de concepto los conceptos de HTTP, validación de requests y persistencia usando Node.js básico sin frameworks.

## Descripción

Web API para la gestión de cuentas financieras (CRUD) y de sus respectivas notas débito y crédito (CRUD). Cada nota pertenece a una cuenta existente. Los datos se registran y recuperan de una base de datos MSSQL Server local pre-existente, con un único usuario de conexión.

No existe gestión de usuarios, roles, autenticación ni tokenización. El proyecto es una prueba de concepto de un curso de Node.js: no requiere rigurosidad extrema.

Entidades:

- **Cuenta**: id (identificador), descripción, estado (activa/eliminada).
- **Nota**: id (identificador), cuenta (referencia a la cuenta), tipo (débito o crédito), monto, descripción, estado (activa/eliminada).

El saldo NO se almacena ni se calcula: la historia cubre únicamente el CRUD plano de cuentas y notas.
- La eliminación (cuentas y notas) es **lógica**: cambio de estado, sin borrado físico de registros.
---

## Criterios de Aceptación

### Escenario 1: Crear cuenta

- **Dado** que la API está en ejecución y la base de datos MSSQL local está disponible
- **Cuando** se envía una solicitud `POST` para crear una cuenta con una descripción válida
- **Entonces** la API responde con código `201` e identifica la cuenta creada con su id
- **Y** la cuenta queda registrada en la base de datos

### Escenario 2: Consultar cuentas

- **Dado** que existen cuentas registradas
- **Cuando** se envía una solicitud `GET` para listar cuentas
- **Entonces** la API responde con código `200` y el cuerpo JSON contiene las cuentas (id y descripción)
- **Y** si se consulta una cuenta por su id, la API responde `200` con los datos de esa cuenta

### Escenario 3: Actualizar cuenta

- **Dado** que existe una cuenta registrada
- **Cuando** se envía una solicitud `PUT` con una descripción válida para esa cuenta
- **Entonces** la API responde con código `200` y la descripción persistida cambia
- **Y** si la cuenta no existe, la API responde `404`

### Escenario 4: Eliminar cuenta (lógica)

- **Dado** que existe una cuenta registrada
- **Cuando** se envía una solicitud para eliminar esa cuenta
- **Entonces** la API responde con código `200` (o `204`) y la cuenta queda marcada como eliminada mediante cambio de estado (eliminación lógica, sin borrado físico)
- **Y** la cuenta ya no figura en las consultas (listado ni consulta por id)

### Escenario 5: Crear nota débito o crédito

- **Dado** que existe una cuenta registrada
- **Cuando** se envía una solicitud `POST` para crear una nota con: la cuenta existente, tipo `debito` o `credito`, monto numérico positivo y descripción
- **Entonces** la API responde con código `201` e identifica la nota creada
- **Y** la nota queda registrada en la base de datos asociada a la cuenta

### Escenario 6: Consultar, actualizar y eliminar notas

- **Dado** que existen notas registradas
- **Cuando** se envían solicitudes `GET` (todas o por id), `PUT` con datos válidos, o de eliminación
- **Entonces** la API responde `200` con los datos o la confirmación, y el estado persistido cambia en consecuencia
- **Y** la eliminación de una nota es lógica: cambio de estado, sin borrado físico; la nota eliminada no figura en las consultas
- **Y** si la nota no existe, la API responde `404`

### Escenario 7: Nota sin cuenta existente

- **Dado** que la cuenta indicada no existe en la base de datos
- **Cuando** se envía una solicitud `POST` para crear una nota contra esa cuenta
- **Entonces** la API responde `404` indicando que la cuenta no existe
- **Y** no se registra ninguna nota

### Escenario 8: Body o formato inválido

- **Dado** que la API recibe una solicitud `POST` o `PUT`
- **Cuando** el body no es JSON válido, falta el `Content-Type: application/json`, o faltan/cumplen mal los campos obligatorios (descripción vacía, tipo diferente de `debito`/`credito`, monto no numérico o no positivo)
- **Entonces** la API responde `400` con un cuerpo JSON que indica el error

### Escenario 9: Método HTTP no soportado

- **Dado** que existe un endpoint para cuentas o notas
- **Cuando** se envía una solicitud con un método no soportado (por ejemplo `DELETE` donde no aplica, o `POST` sobre un recurso que solo se consulta)
- **Entonces** la API responde `405` indicando que el método no está permitido

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** Usuario genérico del curso (consumidor único de la API, sin roles)
- **Permisos requeridos:** Ninguno — sin autenticación, sin tokenización
- **Valor de negocio:** Prueba de concepto de un curso de Node.js: practicar HTTP nativo, validación de requests y persistencia en MSSQL

### Reglas de Negocio

- Una nota siempre pertenece a una cuenta existente; no se puede crear nota contra cuenta inexistente.
- El tipo de nota es exclusivamente `debito` o `credito`.
- El monto de una nota debe ser numérico y positivo.
- Cuenta mínima: id + descripción. Nota mínima: id, cuenta, tipo, monto, descripción.
- La eliminación es lógica (cambio de estado): los registros no se borran físicamente de la base de datos; un recurso eliminado lógicamente no figura en listados ni consultas por id.
- Una cuenta eliminada lógicamente no admite notas nuevas (se trata como inexistente).
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

API REST sobre HTTP. Puntos de entrada (sugerencia, el detalle técnico lo define la arquitectura):

- Cuentas: `GET /cuentas`, `GET /cuentas/{id}`, `POST /cuentas`, `PUT /cuentas/{id}`, eliminar cuenta.
- Notas: `GET /notas`, `GET /notas/{id}`, `POST /notas`, `PUT /notas/{id}`, eliminar nota.

Sin interfaz gráfica: los consumidores son clientes HTTP (por ejemplo, herramientas de API o scripts).

### Sistemas Externos

- **MSSQL Server local**: base de datos pre-existente con un usuario de conexión. Solo se integra (lectura/escritura de datos); NO se crea, gestiona ni provisiona desde esta API.

### Disparadores

- El cliente HTTP envía una solicitud para crear una cuenta
- El cliente HTTP envía una solicitud para consultar cuentas (todas o una por id)
- El cliente HTTP envía una solicitud para actualizar una cuenta
- El cliente HTTP envía una solicitud para eliminar una cuenta
- El cliente HTTP envía una solicitud para crear una nota débito o crédito
- El cliente HTTP envía una solicitud para consultar notas (todas o una por id)
- El cliente HTTP envía una solicitud para actualizar o eliminar una nota

### Entidades del Dominio

- Cuenta
- Nota (el tipo débito/crédito es un atributo de la nota, no una entidad distinta)

### Alcance y Continuidad

- Esta es la **primera historia del proyecto**: no extiende ninguna funcionalidad existente; todo se construye de cero.
- **MSSQL Server local** es un sistema externo fuera del alcance: la API solo se integra con él. La base de datos, las tablas y el usuario de conexión se preparan manualmente como prerrequisito, antes de ejecutar la API.
- No hay autenticación: cualquier cliente puede consumir los endpoints.

### Preview de Interfaz

No aplica — la historia no involucra interfaz gráfica (solo Web API).

---

## Contexto y Referencias

**Arquitectura:** `docs/architecture/index.md` (sin definir aún; el análisis arquitectónico se hará con esta historia)
**Historias relacionadas:** Ninguna (primera historia del proyecto)
**Lecciones aprendidas:** Sin registro previo

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente (métodos, body, headers, formato JSON)
- [ ] Mensajes implementados (errores JSON con códigos HTTP estándar)
- [ ] Persistencia en MSSQL local verificada manualmente (crear, consultar, actualizar, eliminar)
- [ ] Eliminación lógica verificada (cambio de estado; el registro permanece en la base de datos)
- [ ] Requisitos no funcionales cumplidos: Node.js sin frameworks, `.js`/`.mjs`, protocolo `http` nativo, técnicas modernas Node ≥ 24 (`async/await`, sin callbacks, APIs promesa)
