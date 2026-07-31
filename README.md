# Aula Docente

Sistema móvil-first para gestión académica de una docente universitaria. Su núcleo operativo permite registrar firmas y asistencia mediante QR, incluso cuando un curso se divide en varios grupos de laboratorio.

## Stack definido

- Frontend: Vue 3 + TypeScript + Quasar.
- Estado: Pinia.
- Web/PWA: Quasar PWA + Workbox.
- Android: Capacitor.
- Persistencia offline: IndexedDB + Dexie.
- Backend: NestJS.
- Base de datos: PostgreSQL.
- API: REST documentada con OpenAPI.

## Documentación

1. [Idea, alcance y reglas](docs/01-idea-y-alcance.md)
2. [Modelo entidad-relación](docs/02-modelo-entidad-relacion.md)
3. [Flujos del sistema](docs/03-flujos-del-sistema.md)
4. [Arquitectura técnica](docs/04-arquitectura-tecnica.md)
5. [Guía de módulos y pantallas](docs/05-guia-modulos-pantallas.md)

## Base de datos

- [Esquema PostgreSQL](database/001_initial_schema.sql)
- [Datos iniciales](database/002_seed_reference_data.sql)
- [Triggers de integridad](database/003_integrity_triggers.sql)

### Seed de administrador

- Configurar `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` y opcionalmente `ADMIN_SEED_FULL_NAME`.
- Ejecutar `pnpm db:seed:admin`.

## Plantillas

- [Plantilla de módulo](templates/modulo.template.md)
- [Plantilla de pantalla](templates/pantalla.template.md)
- [Plantilla de flujo](templates/flujo.template.md)
- [Plantilla de decisión técnica](templates/decision-tecnica.template.md)

## Principios

- Un estudiante se inscribe una sola vez en un curso.
- Los grupos son divisiones operativas, no cursos duplicados.
- Una clase académica puede ejecutarse en varias sesiones.
- Asistencias y firmas se registran como movimientos auditables.
- Las excepciones nunca sobrescriben silenciosamente el historial.
- La PWA debe seguir operando temporalmente sin conexión y sincronizar después.

---

## Despliegue

### Arquitectura de despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub                               │
│                    (repositorio único)                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │     Netlify     │             │     CapRover    │
    │   (Frontend)    │             │    (Backend)    │
    │                 │             │                 │
    │  Vue + Quasar   │             │  NestJS API     │
    │  PWA instalable │             │  PostgreSQL     │
    │  CDN global     │             │  Adminer        │
    └─────────────────┘             └─────────────────┘
```

### 1. Frontend en Netlify

#### Configuración inicial

1. Sube el repositorio a GitHub
2. Conecta el repositorio en [Netlify](https://app.netlify.com)
3. Netlify detectará automáticamente el archivo `netlify.toml`
4. Configura las variables de entorno en Netlify (si las necesitas):
   - `VITE_API_URL`: URL de tu API en CapRover

#### Deploy automático

Cada push a la rama `main` desplegará automáticamente el frontend.

#### PWA instalable

La aplicación está configurada como PWA. Los usuarios pueden:
- Abrir la URL en su navegador móvil
- Tocar "Agregar a pantalla de inicio"
- Usar la app como si fuera nativa

#### Build local

```bash
pnpm build:frontend
```

Los archivos se generan en `apps/docente-app/dist/spa/`.

---

### 2. Backend en CapRover

#### Requisitos previos

- CapRover instalado y configurado
- Acceso al panel de CapRover

#### Paso 1: Crear las aplicaciones en CapRover

Crea 3 aplicaciones en CapRover:

1. **aula-docente-db** (PostgreSQL)
   - Tipo: One-click app / Docker Compose
   - Usa el servicio `postgres` del `docker-compose.caprover.yml`

2. **aula-docente-adminer** (Adminer)
   - Tipo: One-click app / Docker Compose
   - Usa el servicio `adminer` del `docker-compose.caprover.yml`
   - Habilitar HTTP Basic Auth en CapRover para proteger el acceso

3. **aula-docente-api** (API)
   - Tipo: Deploy from Dockerfile
   - Usa el `Dockerfile` en `apps/api/`

#### Paso 2: Configurar variables de entorno en CapRover

En la aplicación `aula-docente-api`, configura estas variables:

```env
DATABASE_HOST=srv-captain--aula-docente-db
DATABASE_PORT=5432
DATABASE_NAME=aula_docente
DATABASE_USER=aula_user
DATABASE_PASSWORD=<generar-una-contraseña-segura>

JWT_SECRET=<generar-un-secret-seguro>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generar-un-secret-seguro>
JWT_REFRESH_EXPIRES_IN=7d
JWT_SESSION_EXPIRES_IN=1d

AUTH_REFRESH_COOKIE_NAME=aula_refresh_token
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=true

ADMIN_SEED_EMAIL=admin@example.edu
ADMIN_SEED_PASSWORD=<contraseña-segura>
ADMIN_SEED_FULL_NAME=Administrador Aula Docente
ADMIN_SEED_ROLE=ADMIN

R2_ACCOUNT_ID=<tu-account-id>
R2_ACCESS_KEY_ID=<tu-access-key>
R2_SECRET_ACCESS_KEY=<tu-secret-key>
R2_BUCKET_NAME=aula-docente
R2_PUBLIC_URL=<tu-r2-public-url>

FRONTEND_URL=<url-de-tu-frontend-en-netlify>
PORT=3000
NODE_ENV=production
```

#### Paso 3: Deploy con Docker Compose

Para desplegar toda la stack (PostgreSQL + Adminer + API):

```bash
# En tu servidor CapRover
docker-compose -f docker-compose.caprover.yml up -d
```

O usa el panel de CapRover para crear las aplicaciones individualmente.

#### Paso 4: Configurar el dominio

En CapRover, configura el dominio para cada aplicación:
- `api.tu-dominio.com` → aula-docente-api
- `adminer.tu-dominio.com` → aula-docente-adminer
- `db.tu-dominio.com` → aula-docente-db (solo si necesitas acceso externo)

#### Paso 5: Habilitar HTTPS

En CapRover, habilita HTTPS para todas las aplicaciones con Let's Encrypt.

#### Migraciones automáticas

Cada vez que hagas deploy de la API:
1. El `entrypoint.sh` se ejecuta automáticamente
2. Ejecuta las migraciones pendientes de TypeORM
3. Ejecuta el seed del admin (idempotente)
4. Inicia el servidor

No necesitas ejecutar migraciones manualmente.

#### Deploy manual desde GitHub

```bash
# Clonar el repositorio en tu servidor CapRover
git clone https://github.com/tu-usuario/aula-docente.git
cd aula-docente

# Deploy de la API
caprover deploy -a aula-docente-api -b main
```

O configura el deploy automático en CapRover para que detecte cambios en GitHub.

---

### 3. Despliegue local con Docker Compose

Para desarrollo o pruebas locales:

```bash
# Levantar toda la stack
docker-compose -f docker-compose.caprover.yml up -d

# Ver logs
docker-compose -f docker-compose.caprover.yml logs -f

# Detener
docker-compose -f docker-compose.caprover.yml down

# Detener y eliminar volúmenes
docker-compose -f docker-compose.caprover.yml down -v
```

Servicios disponibles:
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Adminer: http://localhost:8080
- PostgreSQL: localhost:5432

---

### 4. Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Levantar base de datos
pnpm db:up

# Ejecutar migraciones
pnpm db:migrate:run

# Seed del admin
pnpm db:seed:admin

# Iniciar frontend y backend
pnpm dev
```

Servicios en desarrollo:
- Frontend: http://localhost:9000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

---

### 5. Estructura del proyecto

```
aula-docente/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── database/
│   │   │   │   ├── migrations/ # Migraciones TypeORM
│   │   │   │   └── seeds/      # Seeds de datos
│   │   │   └── ...
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh       # Script de inicio con migraciones
│   │   └── package.json
│   │
│   └── docente-app/            # Frontend Vue + Quasar
│       ├── src/
│       ├── dist/               # Build de producción
│       └── package.json
│
├── database/                   # Scripts SQL iniciales
├── docker-compose.caprover.yml # Stack completa para CapRover
├── netlify.toml                # Configuración de Netlify
├── package.json                # Scripts del monorepo
└── pnpm-workspace.yaml
```

---

### 6. Comandos útiles

```bash
# Generar nueva migración
pnpm migration:generate

# Ejecutar migraciones
pnpm migration:run

# Revertir última migración
pnpm migration:revert

# Build completo
pnpm build

# Lint
pnpm lint

# Tests
pnpm test
```

---

### 7. Troubleshooting

#### Las migraciones no se ejecutan

Verifica que:
- La base de datos esté accesible desde el contenedor de la API
- Las variables de entorno estén configuradas correctamente
- Revisa los logs: `docker logs aula-docente-api`

#### El frontend no conecta con la API

Verifica que:
- `VITE_API_URL` esté configurada en Netlify
- CORS esté habilitado en la API con la URL del frontend
- HTTPS esté habilitado en ambos servicios

#### Adminer no puede conectar

Verifica que:
- El servidor PostgreSQL sea accesible desde el contenedor de Adminer
- En CapRover, usa `srv-captain--aula-docente-db` como hostname

---

### 8. Seguridad

- Cambia todas las contraseñas por defecto antes de desplegar
- Habilita HTTPS en todos los servicios
- Usa variables de entorno para secrets, nunca las subas al repositorio
- Protege Adminer con HTTP Basic Auth en CapRover
- Configura backups automáticos de PostgreSQL

---

### 9. Backups

#### PostgreSQL

```bash
# Backup manual
docker exec aula-docente-db pg_dump -U aula_user aula_docente > backup.sql

# Restaurar
docker exec -i aula-docente-db psql -U aula_user aula_docente < backup.sql
```

#### Automatizar backups

Configura un cron job en tu servidor:

```bash
0 2 * * * docker exec aula-docente-db pg_dump -U aula_user aula_docente > /backups/aula-docente-$(date +\%Y\%m\%d).sql
```

---

### 10. Soporte

Para problemas o preguntas:
- Revisa la documentación en `docs/`
- Consulta los logs de los contenedores
- Verifica que todas las variables de entorno estén configuradas
