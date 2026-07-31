# Docente App: configuración y especificación base

## Objetivo

Este documento describe la configuración actual de `apps/docente-app` y la alinea con las especificaciones definidas en:

- `docs/04-arquitectura-tecnica.md`
- `docs/05-guia-modulos-pantallas.md`
- `templates/pantalla.template.md`

Sirve como referencia para continuar la implementación del frontend móvil-first de Aula Docente.

## Stack y configuración actual

### Base tecnológica

- Framework: Quasar sobre Vue 3 + TypeScript.
- Ruteo: Vue Router.
- Estado: Pinia.
- HTTP: Axios.
- Persistencia offline: Dexie sobre IndexedDB.
- PWA: Workbox con `generateSW`.
- Android: Capacitor habilitado en configuración.

### Quasar

Archivo fuente: `apps/docente-app/quasar.config.ts`

- `boot`: `axios`
- `css`: `app.scss`
- `extras`: `roboto-font`, `material-icons`
- `devServer.port`: `9000`
- `framework.plugins`:
  - `Notify`
  - `Dialog`
  - `Loading`
  - `LocalStorage`
  - `SessionStorage`
- `pwa.workboxMode`: `generateSW`
- `capacitor.hideSplashscreen`: `true`
- `htmlVariables.title`: `Aula Docente`

### Branding actual

La marca definida en Quasar usa:

- `primary`: `#1976D2`
- `secondary`: `#26A69A`
- `accent`: `#FF7043`
- `positive`: `#66BB6A`
- `negative`: `#EF5350`
- `info`: `#2196F3`
- `warning`: `#FFA726`

Esto está razonablemente alineado con la guía visual de `docs/05`:

- azul institucional
- coral como acción principal
- verde tenue para éxito
- ámbar para advertencias

### HTTP y autenticación frontend

Archivo fuente: `apps/docente-app/src/boot/axios.ts`

- `baseURL`: `process.env.API_URL || 'http://localhost:3000'`
- `timeout`: `10000`
- agrega `Authorization: Bearer <token>` desde `localStorage.auth_token`
- ante `401` elimina `auth_token` y redirige a `/login`

### Guard de rutas

Archivo fuente: `apps/docente-app/src/boot/router-guard.ts`

- si la ruta requiere auth y no hay token, redirige a `/login`
- si el usuario ya tiene token y entra a `/login`, redirige a `/`

### Estado offline

Archivos fuente:

- `apps/docente-app/src/offline/database.ts`
- `apps/docente-app/src/offline/queue.ts`
- `apps/docente-app/src/stores/sync.ts`

Estado actual:

- base Dexie `aula-docente-db`
- tabla `operations`
  - `clientOperationId`
  - `type`
  - `payload`
  - `status`
  - `createdAt`
  - `syncedAt`
  - `error`
- tabla `courses`
  - `id`
  - `name`
  - `data`
  - `lastUpdated`
- estados soportados localmente:
  - `PENDING`
  - `SYNCING`
  - `SYNCED`
  - `CONFLICT`
  - `FAILED`
- sincronización real aún pendiente de implementación en `syncPending()`

## Estructura funcional actual

### Layouts

- `AuthLayout.vue`
  - contenedor simple para flujo de login
- `MainLayout.vue`
  - header principal
  - drawer lateral
  - acceso a Inicio, Cursos, Estudiantes, Excepciones y Reportes
  - indicador offline
  - cierre de sesión

### Rutas registradas

Archivo fuente: `apps/docente-app/src/router/routes.ts`

| Ruta | Nombre esperado | Pantalla | Auth |
|---|---|---|---|
| `/login` | login | `LoginPage.vue` | No |
| `/` | home | `HomePage.vue` | Sí |
| `/courses` | courses | `CoursesPage.vue` | Sí |
| `/courses/:id` | course-detail | `CourseDetailPage.vue` | Sí |
| `/students` | students | `StudentsPage.vue` | Sí |
| `/scan` | scan | `ScanPage.vue` | Sí |
| `/exceptions` | exceptions | `ExceptionsPage.vue` | Sí |
| `/reports` | reports | `ReportsPage.vue` | Sí |
| `/:catchAll(.*)*` | not-found | `ErrorNotFound.vue` | No |

Nota:

- hoy las rutas no declaran explícitamente `name`.
- las vistas usan navegación por nombre en algunos puntos, por lo que conviene normalizar `name` en la siguiente iteración.

## Especificación de pantallas actuales

Las siguientes pantallas ya existen como base visual y deben evolucionar usando `templates/pantalla.template.md`.

### Pantalla: Login

#### Objetivo

Permitir autenticación de docente o administrador con opción de recordar sesión.

#### Ruta

`/login`

#### Roles autorizados

- `ADMIN`
- `TEACHER`
- `ASSISTANT` cuando exista flujo de permisos finos

#### Contexto requerido

- Curso: opcional.
- Sesión: opcional.
- Conexión: requerida para iniciar sesión.

#### Componentes actuales

- marca y nombre del sistema
- subtítulo funcional
- input de correo
- input de contraseña
- toggle `Recordar sesión`
- botón de inicio de sesión
- acción secundaria de recuperación de contraseña

#### Estados requeridos por docs

- Inicial
- Cargando
- Credenciales incorrectas
- Sin conexión
- Sesión vencida

#### Gap actual

- el store actual no envía `rememberMe` al backend
- no consume refresh automático por cookie
- falta estado visual de conectividad

### Pantalla: Inicio

#### Objetivo

Mostrar resumen operativo del día y acceso a acciones rápidas.

#### Ruta

`/`

#### Roles autorizados

- `ADMIN`
- `TEACHER`

#### Contexto requerido

- Curso: opcional.
- Sesión: opcional.
- Conexión: offline permitido con datos ya descargados.

#### Jerarquía visual requerida

1. Información de hoy.
2. Estado de sincronización.
3. Acciones rápidas.

#### Estado actual

- tarjeta de próxima clase
- tarjeta de estado de sincronización
- acciones rápidas:
  - Escanear
  - Tomar asistencia
  - Crear sesión
  - Buscar estudiante

#### Gap actual

- faltan sesiones activas
- faltan firmas del día
- faltan excepciones por revisar
- faltan datos reales desde API

### Pantalla: Cursos

#### Objetivo

Listar cursos por periodo y permitir navegación al detalle y creación.

#### Ruta

`/courses`

#### Roles autorizados

- `ADMIN`
- `TEACHER`

#### Contexto requerido

- Curso: no aplica.
- Sesión: no aplica.
- Conexión: offline permitido si el curso fue cacheado.

#### Requerimientos de docs

- lista por periodo
- filtro por estado
- crear curso
- resumen de estudiantes, grupos y avance
- cerrar o archivar curso

#### Estado actual

- título
- botón `Crear curso`
- estado vacío

#### Gap actual

- faltan filtros
- falta agrupación por periodo
- falta consumo de `/courses`
- falta resumen por curso

### Pantalla: Detalle de curso

#### Objetivo

Centralizar navegación y métricas de un curso concreto.

#### Ruta

`/courses/:id`

#### Roles autorizados

- `ADMIN`
- `TEACHER` dueño del curso

#### Contexto requerido

- Curso: obligatorio.
- Sesión: opcional.
- Conexión: offline parcial con datos descargados.

#### Requerimientos derivados

- resumen de estudiantes
- grupos
- sesiones
- firmas
- asistencia
- excepciones
- acceso a reportes del curso

#### Estado actual

- placeholder de detalle

### Pantalla: Estudiantes

#### Objetivo

Administrar lista oficial, búsqueda, carga manual e importación.

#### Ruta

`/students`

#### Roles autorizados

- `ADMIN`
- `TEACHER`

#### Contexto requerido

- Curso: opcional en la ruta actual, pero funcionalmente debería poder filtrarse por curso.
- Sesión: no aplica.
- Conexión: offline parcial para consulta.

#### Requerimientos de docs

- lista oficial
- búsqueda
- registro manual
- importación CSV/XLSX
- validación de duplicados
- retiro
- perfil e historial
- generación y regeneración de QR

#### Estado actual

- título
- botón `Importar CSV`
- estado vacío

#### Gap actual

- falta tabla/listado real
- falta búsqueda
- falta contexto por curso
- falta flujo de QR

### Pantalla: Escanear

#### Objetivo

Registrar firmas o asistencia por QR.

#### Ruta

`/scan`

#### Roles autorizados

- `ADMIN`
- `TEACHER`
- `ASSISTANT` cuando se habilite por curso

#### Contexto requerido

- Curso: obligatorio.
- Sesión: obligatoria.
- Conexión: offline permitido sobre sesiones y cursos previamente descargados.

#### Requerimientos de docs

- encabezado fijo con curso, sesión, actividad, modo y conectividad
- resultado con foto, nombre, código, grupo, acción, total y advertencias

#### Estado actual

- placeholder para selección previa de curso y actividad

#### Gap actual

- falta cámara/escáner
- falta selector de sesión
- falta modo firma/asistencia
- falta integración con reglas de validación del backend

### Pantalla: Excepciones

#### Objetivo

Operar la bandeja de solicitudes especiales y resoluciones.

#### Ruta

`/exceptions`

#### Roles autorizados

- `ADMIN`
- `TEACHER`

#### Contexto requerido

- Curso: opcional global, recomendable filtro por curso.
- Sesión: opcional.
- Conexión: requerida para resolución; offline limitado para borrador local.

#### Requerimientos de docs

- bandeja pendiente
- tipo y prioridad
- estudiante, curso, actividad y sesión
- motivo
- evidencias
- aprobar, rechazar o solicitar información

#### Estado actual

- título
- estado vacío

#### Gap actual

- falta listado real
- falta filtros por estado/curso
- falta acciones de resolución

### Pantalla: Reportes

#### Objetivo

Consultar consolidaciones por curso y grupo.

#### Ruta

`/reports`

#### Roles autorizados

- `ADMIN`
- `TEACHER`

#### Contexto requerido

- Curso: opcional al entrar, obligatorio para reporte detallado.
- Sesión: opcional.
- Conexión: requerida.

#### Requerimientos de docs

- consolidado del curso
- comparación por grupos
- firmas por actividad
- asistencia por clase
- estudiantes en riesgo
- excepciones y recuperaciones
- exportación Excel/PDF

#### Estado actual

- placeholder para selección de curso

#### Gap actual

- falta consumo de endpoints `/reports`
- falta filtros
- falta exportación

## Configuración objetivo recomendada para continuar

### Auth frontend

Debe alinearse con el backend actual:

- `POST /auth/login` enviando `email`, `password`, `rememberMe`
- `GET /auth/profile`
- `POST /auth/refresh` usando cookie `httpOnly`
- `POST /auth/logout`

Recomendación:

- mantener access token en memoria de store, no en `localStorage`
- usar refresh por cookie para rehidratar sesión
- usar `rememberMe` para sesión persistente en navegador confiable

### Router

Recomendado ajustar:

- nombres explícitos por ruta
- meta por permisos
- manejo de sesión expirada con refresh antes de redirigir
- rutas anidadas por módulo cuando el detalle funcional crezca

### Offline

Recomendado completar:

- sincronización real por lotes con `/sync/batch`
- cache de cursos habilitados offline
- cache de sesiones del día
- cache de estudiantes necesarios para escaneo
- manejo de conflicto visual para operaciones `CONFLICT`

### Módulos frontend sugeridos

Para alinearse con `docs/04`, la siguiente estructura sería la meta:

- `src/modules/auth`
- `src/modules/courses`
- `src/modules/students`
- `src/modules/groups`
- `src/modules/sessions`
- `src/modules/attendance`
- `src/modules/signatures`
- `src/modules/exceptions`
- `src/modules/reports`

## Pendientes prioritarios

- ajustar `stores/auth.ts` para enviar `rememberMe`
- cambiar estrategia de token local a access token en memoria + refresh cookie
- registrar `router-guard` en `quasar.config.ts` si se quiere usar como boot formal
- nombrar rutas en `routes.ts`
- documentar cada pantalla nueva con `templates/pantalla.template.md`
- crear pantallas faltantes de:
  - grupos
  - sesiones
  - asistencia
  - firmas
  - creación de curso
  - perfil del usuario

## Archivo fuente de referencia

Este documento se construyó a partir del estado actual de:

- `apps/docente-app/quasar.config.ts`
- `apps/docente-app/src/router/routes.ts`
- `apps/docente-app/src/boot/axios.ts`
- `apps/docente-app/src/boot/router-guard.ts`
- `apps/docente-app/src/layouts/*.vue`
- `apps/docente-app/src/pages/*.vue`
- `apps/docente-app/src/offline/*.ts`
- `apps/docente-app/src/stores/*.ts`
