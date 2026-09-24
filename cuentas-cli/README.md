# cuentas-cli

CLI de ejecución automatizada del flujo de integración contra la Web API [`cuentas-webapi`](../cuentas-webapi) — [HU 2](docs/stories/2-cli-flujo-integracion/historia.md).

Ejecuta de forma **secuencial y dependiente** un flujo de 7 pasos contra las rutas `/cuentas` y `/notas` (CRUD + eliminación lógica + manejo de errores), verifica en cada paso el código de estado y una condición del cuerpo, y aplica **fail fast**: se detiene en el primer fallo.

## Stack

- Node.js ≥ 24 (`^24.21`), ESM, **TypeScript**
- **Cero dependencias de runtime** — HTTP con `fetch` nativo de Node
- `typescript` + `tsx` + `@types/node` solo en `devDependencies`

## Requisitos previos

1. Node.js ≥ 24 instalado.
2. La API `cuentas-webapi` corriendo (con su MSSQL local):

   ```powershell
   cd ..\cuentas-webapi
   . .\.dev-env.ps1
   npm run dev
   ```

## Instalación

```bash
npm install
```

## Uso

```bash
# Desarrollo (tsx, sin compilar)
npm run dev

# Compilar a dist/ (tsc, strict)
npm run build

# Ejecutar la versión compilada
npm start
```

### Variable de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `CUENTAS_API_BASE` | `http://localhost:3000` | URL base de la API |

```powershell
# PowerShell: apuntar a otra instancia
$env:CUENTAS_API_BASE = "http://localhost:3001"
npm run dev
```

## Los 7 pasos

| Paso | Petición | Esperado |
|------|----------|----------|
| 1 | `POST /cuentas` — `{ "descripcion": "Cuenta de ahorro" }` | `201` + `id` numérico (se captura `cuentaId`) |
| 2 | `GET /cuentas/{id}` | `200` + mismo `id` y `descripcion` |
| 3 | `POST /notas` — `{ cuentaId, "tipo": "credito", "monto": 150.75, "descripcion": "Pago de cliente" }` | `201` + `id` (se captura `notaId`) |
| 4 | `POST /notas` — `{ cuentaId, "tipo": "credito", "monto": 0, ... }` | `400` + `{ "error" }` (el rechazo ES lo esperado) |
| 5 | `PUT /notas/{id}` — `{ cuentaId, "tipo": "debito", "monto": 80, "descripcion": "Pago de cliente actualizado" }` | `200` + valores actualizados |
| 6 | `DELETE /notas/{id}` y luego `GET /notas/{id}` | `204` sin cuerpo y luego `404` (eliminación lógica) |
| 7 | `DELETE /cuentas/{id}` y luego `GET /cuentas/{id}` | `204` y luego `404` (eliminación lógica) |

Los valores de los payloads son los mismos que la DoD manual de la API (`cuentas-webapi/docs/http/cuentas.http` y `notas.http`).

## Salida y códigos de exit

Por cada paso imprime una línea con número, nombre, método + ruta, esperado vs real y ✅/❌:

```
Flujo de integración — API http://localhost:3000
Paso 1 — Crear cuenta — POST /cuentas — esperado estado 201 → real estado 201 — ✅
Paso 2 — Consultar cuenta — GET /cuentas/7 — esperado estado 200 → real estado 200 — ✅
...
Resumen: 7/7 pasos exitosos — ✅ flujo completo
```

| Código | Significado |
|--------|-------------|
| `0` | 7/7 pasos exitosos |
| `1` | Fallo en un paso (discrepancia esperado vs real) o API caída — imprime el paso fallido con el detalle |

La ejecución es **reproducible**: cada corrida crea una cuenta nueva (IDENTITY), no hay que limpiar la BD.

## Estructura

```
cuentas-cli/
├── package.json          # ESM + scripts dev/build/start
├── tsconfig.json         # NodeNext, ES2022, strict
├── src/
│   ├── config.ts         # obtenerBaseUrl() — env CUENTAS_API_BASE con default
│   ├── tipos.ts          # Cuenta, Nota, inputs, RespuestaApi, ResultadoPaso, ContextoFlujo
│   ├── cliente-api.ts    # peticion() sobre fetch nativo; ErrorRed tipado (API caída)
│   ├── pasos.ts          # PASOS: los 7 pasos con verificación estado + cuerpo
│   └── index.ts          # Orquestador secuencial fail fast + reporte + exit code
└── docs/stories/2-cli-flujo-integracion/   # HU 2: historia, plan, registro
```

## Alcance (y fuera de alcance)

- **En alcance:** los 7 pasos del PRD + comportamiento global fail fast. Un solo comando, sin subcomandos.
- **Fuera de alcance:** escenarios extra (405, `Content-Type` incorrecto), subcomandos/flags, tocar la BD directamente, autenticación, UI.

## Documentación de la historia

- [historia.md](docs/stories/2-cli-flujo-integracion/historia.md) — narrativa y criterios de aceptación
- [refinamiento.md](docs/stories/2-cli-flujo-integracion/refinamiento.md) — plan técnico aprobado
- [dev-record.md](docs/stories/2-cli-flujo-integracion/dev-record.md) — registro de desarrollo y DoD
- [cambios.md](docs/stories/2-cli-flujo-integracion/cambios.md) — registro cronológico
