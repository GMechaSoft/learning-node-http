# Historia de Usuario

**Como** agente de integración y automatización,
**Quiero** ejecutar de forma secuencial las colecciones de la API de Cuentas y Notas,
**Para** validar que el comportamiento del CRUD, la persistencia de datos y el manejo de errores cumplen con las reglas de negocio definidas.

## Descripción

CLI en TypeScript (proyecto `cuentas-cli`) que consume la Web API `cuentas-webapi` (base por defecto `http://localhost:3000`) y ejecuta de forma secuencial un flujo de 7 pasos contra las rutas `/cuentas` y `/notas`. Cada paso realiza una petición HTTP, verifica el código de estado esperado y una condición sobre el cuerpo de la respuesta, e imprime el resultado. Si un paso no cumple lo esperado, el CLI se detiene en el primer fallo (fail fast) y termina con código de salida `1`. Al completar los 7 pasos, termina con código de salida `0`.

El CLI usa `fetch` nativo de Node (cero dependencias de runtime); TypeScript se compila con `tsc` y se ejecuta en desarrollo con `tsx`.

---

## Criterios de Aceptación

### Escenario 1: Paso 1 — Creación de entidad base

- **Dado** que la API está corriendo en `http://localhost:3000`
- **Cuando** el CLI ejecuta el Paso 1 con una `descripcion` válida
- **Entonces** realiza `POST /cuentas`, verifica que la respuesta sea `201` y que el cuerpo contenga un `id` numérico generado, e imprime el paso como exitoso

### Escenario 2: Paso 2 — Consulta de la cuenta

- **Dado** que el Paso 1 creó la cuenta y capturó su `id`
- **Cuando** el CLI ejecuta el Paso 2
- **Entonces** realiza `GET /cuentas/{id}`, verifica que la respuesta sea `200` y que el cuerpo contenga los datos de la cuenta creada (mismo `id` y `descripcion`), e imprime el paso como exitoso

### Escenario 3: Paso 3 — Registro de nota de crédito

- **Dado** que existe la cuenta creada en el Paso 1
- **Cuando** el CLI ejecuta el Paso 3 enviando `cuentaId`, `tipo` = `"credito"`, un `monto` positivo y una `descripcion`
- **Entonces** realiza `POST /notas`, verifica que la respuesta sea `201` y que el cuerpo contenga el `id` de la nota creada, e imprime el paso como exitoso

### Escenario 4: Paso 4 — Comprobación de validaciones (monto inválido)

- **Dado** que la cuenta existe y el flujo llegó al Paso 4
- **Cuando** el CLI ejecuta el Paso 4 enviando `POST /notas` con `monto` negativo o igual a cero
- **Entonces** verifica que el servidor rechace la petición con código `400` y un cuerpo JSON `{ "error": ... }`, e imprime el paso como exitoso (el rechazo ES el comportamiento esperado)

### Escenario 5: Paso 5 — Actualización del registro

- **Dado** que existe la nota creada en el Paso 3
- **Cuando** el CLI ejecuta el Paso 5 con `tipo` = `"debito"`, un `monto` ajustado y una nueva `descripcion`
- **Entonces** realiza `PUT /notas/{id}`, verifica que la respuesta sea `200` y que el cuerpo refleje los valores modificados, e imprime el paso como exitoso

### Escenario 6: Paso 6 — Eliminación lógica de la nota

- **Dado** que existe la nota actualizada en el Paso 5
- **Cuando** el CLI ejecuta el Paso 6
- **Entonces** realiza `DELETE /notas/{id}`, verifica que la respuesta sea `204` sin cuerpo, y luego realiza `GET /notas/{id}` verificando que la respuesta sea `404`, e imprime el paso como exitoso

### Escenario 7: Paso 7 — Eliminación lógica de la cuenta

- **Dado** que el flujo completó el Paso 6 y la cuenta del Paso 1 sigue activa
- **Cuando** el CLI ejecuta el Paso 7
- **Entonces** realiza `DELETE /cuentas/{id}`, verifica que la respuesta sea `204`, y luego realiza `GET /cuentas/{id}` verificando que la respuesta sea `404`, e imprime el paso como exitoso

### Escenario 8: Comportamiento global — secuencia y fail fast

- **Dado** que el CLI ejecuta el flujo completo
- **Cuando** todos los 7 pasos cumplen el código de estado y la condición esperada
- **Entonces** el CLI imprime un resumen de 7/7 pasos exitosos y termina con código de salida `0`

- **Dado** que el CLI ejecuta el flujo completo
- **Cuando** algún paso no cumple el código de estado o la condición esperada (incluida la API caída o sin respuesta)
- **Entonces** el CLI detiene la ejecución en ese paso, imprime el paso fallido con el detalle de la discrepancia (esperado vs. real) y termina con código de salida `1`

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** desarrollador / ingeniero de QA que valida la API localmente.
- **Permisos requeridos:** ninguno (la API no tiene autenticación).
- **Valor de negocio:** automatizar la verificación repetible del CRUD de cuentas y notas (persistencia y manejo de errores) sin depender de clics manuales en clientes HTTP.

### Reglas de Negocio

- El flujo es **secuencial y dependiente**: el `id` de la cuenta del Paso 1 alimenta los Pasos 2, 3 y 7; el `id` de la nota del Paso 3 alimenta los Pasos 5 y 6.
- **Fail fast**: la ejecución se detiene en el primer paso fallido (decisión del PO).
- Los códigos de estado esperados provienen del contrato de la API `cuentas-webapi`: `201` (creación + id), `200` (lectura/actualización), `400` (validación), `204` (eliminación lógica), `404` (no existe o eliminado lógicamente).
- La eliminación es **lógica** en la API (`estado = 0`); el CLI solo verifica el comportamiento observable por HTTP (`204` y luego `404`). La confirmación en BD (`estado = 0`) es verificación manual opcional, fuera del alcance del CLI.
- El Paso 4 **espera el rechazo** (`400`): para ese paso, el rechazo es el resultado exitoso.

### Interfaz

- **Línea de comandos:** `cuentas-cli` ejecuta el flujo completo de 7 pasos al invocarse (PoC: un solo comando, sin subcomandos).
- **Salida en consola:** por cada paso, línea con número, descripción, método + ruta, código esperado vs. real y ✅/❌. Al final, resumen `X/7 pasos exitosos`.
- **Código de salida:** `0` = flujo completo, `1` = fallo en un paso o API no disponible.
- La URL base se toma de la variable de entorno `CUENTAS_API_BASE` con default `http://localhost:3000`.

### Sistemas Externos

- **Web API `cuentas-webapi`** (Node.js, `node:http` nativo) corriendo en `http://localhost:3000` — pre-requisito: debe estar iniciada antes de ejecutar el CLI.
- **MSSQL Server local** (localhost:1433): indirecto, solo como backend de la API. El CLI no lo toca.

### Disparadores

El usuario ejecuta el comando del CLI para correr el flujo completo.
La ejecución es reproducible: cada corrida crea una cuenta nueva (IDENTITY), por lo que re-ejecutable sin limpiar BD.

### Entidades del Dominio

Cuenta
Nota

### Alcance y Continuidad

- **En alcance:** los 7 pasos del PRD + comportamiento global de secuencia/fail fast. CLI TypeScript con cero dependencias de runtime (`fetch` nativo).
- **Fuera de alcance:** escenarios extra de validación técnica (405 método no permitido, 400 por `Content-Type` incorrecto) — el PO descartó este alcance; subcomandos/flags de CLI; tocar la BD directamente; autenticación; UI.
- **Restricción heredada (solo de la API, NO del CLI):** la API es Node ESM sin frameworks; el CLI, en cambio, **sí** usa TypeScript (decisión PO) con `tsc` + `tsx` en devDependencies y cero dependencias de runtime.
- **Historias relacionadas:** depende de que las US 1.1 (CRUD cuentas) y 1.2 (CRUD notas) estén implementadas en `cuentas-webapi` — ambas completadas.

### Preview de Interfaz

N/A — salida de consola, sin UI.

---

## Contexto y Referencias

**Arquitectura:** `cuentas-webapi/docs/architecture/index.md` (GPS de la API: contrato de errores, eliminación lógica, DDL) — la arquitectura del CLI se define en el refinamiento de esta historia.
**Historias relacionadas:** 1.1 (CRUD cuentas financieras), 1.2 (CRUD notas débito/crédito).
**Lecciones aprendidas:** del dev de 1.2 — validar primero la forma del input antes de consultar BD evitó un 500 por `cuentaId` no numérico; en el CLI, la verificación por paso debe ser específica (código + condición del cuerpo) para que el fallo señale el paso exacto.

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente
- [ ] Mensajes implementados
