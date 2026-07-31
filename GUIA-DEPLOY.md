# Guía de Despliegue Completo con GitHub y Auto-Deploy

Esta guía te llevará paso a paso desde el código local hasta un sistema completamente desplegado con auto-deploy en cada push a GitHub.

---

## Paso 1: Subir el código a GitHub

### 1.1 Crear repositorio en GitHub

1. Ve a [GitHub](https://github.com)
2. Click en "New repository"
3. Nombre: `aula-docente`
4. **NO** inicializar con README (ya lo tienes)
5. Click "Create repository"

### 1.2 Conectar repositorio local

```bash
# En tu directorio del proyecto
git remote add origin https://github.com/TU-USUARIO/aula-docente.git
git branch -M main
git push -u origin main
```

### 1.3 Verificar

Recarga la página de GitHub y deberías ver todos los archivos.

---

## Paso 2: Configurar Netlify para el Frontend

### 2.1 Conectar GitHub con Netlify

1. Ve a [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Selecciona "GitHub"
4. Autoriza Netlify para acceder a tu repositorio
5. Selecciona el repositorio `aula-docente`

### 2.2 Configurar el build

Netlify detectará automáticamente el archivo `netlify.toml`. Verifica que esté configurado así:

- **Build command**: `pnpm install --frozen-lockfile && pnpm build:frontend`
- **Publish directory**: `apps/docente-app/dist/spa`
- **Node version**: `20`

### 2.3 Configurar variables de entorno (si las necesitas)

En Netlify → Site settings → Environment variables:

```env
VITE_API_URL=https://api.tu-dominio-caprover.com
```

### 2.4 Desplegar

Click "Deploy site". Netlify:
- Detectará cambios en cada push a `main`
- Desplegará automáticamente el frontend
- Te dará una URL como: `https://aula-docente-abc123.netlify.app`

### 2.5 Configurar dominio personalizado (opcional)

1. Netlify → Domain settings → "Add custom domain"
2. Ingresa tu dominio (ej: `app.tu-dominio.com`)
3. Configura los DNS según las instrucciones de Netlify
4. Netlify generará el certificado SSL automáticamente

### 2.6 Verificar PWA

Una vez desplegado:
1. Abre la URL en tu celular
2. Toca el menú del navegador → "Agregar a pantalla de inicio"
3. La app se instalará como PWA

---

## Paso 3: Configurar CapRover para el Backend

### 3.1 Acceder al panel de CapRover

Ve a tu panel de CapRover: `https://captain.tu-servidor.com`

### 3.2 Crear la aplicación de PostgreSQL

1. Click "Apps" → "One-Click Apps/Databases"
2. Busca "PostgreSQL"
3. Configura:
   - **App Name**: `aula-docente-db`
   - **PostgreSQL User**: `aula_user`
   - **PostgreSQL Password**: `<genera-una-contraseña-segura>`
   - **PostgreSQL Database**: `aula_docente`
4. Click "Create"

### 3.3 Crear la aplicación de Adminer

1. Click "Apps" → "One-Click Apps/Databases"
2. Busca "Adminer"
3. Configura:
   - **App Name**: `aula-docente-adminer`
4. Click "Create"
5. Ve a la app → "HTTP Settings"
6. En "Base Path" deja vacío
7. Habilita "HTTP Basic Auth" para proteger el acceso:
   - User: `admin`
   - Password: `<genera-una-contraseña>`
8. Click "Save"

### 3.4 Crear la aplicación de la API

1. Click "Apps" → "Create New App"
2. **App Name**: `aula-docente-api`
3. **Has Persistent Data**: ✅ (marca esta opción)
4. Click "Create"

### 3.5 Configurar el deploy de la API

1. Ve a la app `aula-docente-api` → "Deployment"
2. Selecciona "Deploy from Dockerfile"
3. Configura:
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Repo**: `https://github.com/TU-USUARIO/aula-docente.git`
   - **Branch**: `main`
4. Click "Save & Update"

### 3.6 Configurar variables de entorno de la API

Ve a `aula-docente-api` → "App Configs" → "Environment Variables"

Agrega estas variables:

```env
DATABASE_HOST=srv-captain--aula-docente-db
DATABASE_PORT=5432
DATABASE_NAME=aula_docente
DATABASE_USER=aula_user
DATABASE_PASSWORD=<la-misma-que-usaste-en-postgresql>

JWT_SECRET=<genera-un-string-aleatorio-largo>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<genera-otro-string-aleatorio-largo>
JWT_REFRESH_EXPIRES_IN=7d
JWT_SESSION_EXPIRES_IN=1d

AUTH_REFRESH_COOKIE_NAME=aula_refresh_token
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=true

ADMIN_SEED_EMAIL=admin@example.edu
ADMIN_SEED_PASSWORD=<contraseña-segura-para-el-admin>
ADMIN_SEED_FULL_NAME=Administrador Aula Docente
ADMIN_SEED_ROLE=ADMIN

R2_ACCOUNT_ID=<tu-account-id-de-cloudflare>
R2_ACCESS_KEY_ID=<tu-access-key-de-r2>
R2_SECRET_ACCESS_KEY=<tu-secret-key-de-r2>
R2_BUCKET_NAME=aula-docente
R2_PUBLIC_URL=<tu-url-publica-de-r2>

FRONTEND_URL=https://tu-frontend-en-netlify.com
PORT=3000
NODE_ENV=production
```

### 3.7 Desplegar la API

1. Ve a "Deployment"
2. En "Method" selecciona "Deploy from Dockerfile"
3. Click "Deploy Now"
4. Espera a que termine el build (puede tardar 5-10 minutos la primera vez)

### 3.8 Configurar el dominio de la API

1. Ve a "HTTP Settings"
2. En "Custom Domain" ingresa: `api.tu-dominio.com`
3. Click "Enable SSL" para habilitar HTTPS con Let's Encrypt
4. Configura los DNS según las instrucciones de CapRover

### 3.9 Configurar el dominio de Adminer

1. Ve a `aula-docente-adminer` → "HTTP Settings"
2. En "Custom Domain" ingresa: `adminer.tu-dominio.com`
3. Click "Enable SSL"
4. Configura los DNS

### 3.10 Verificar que la API funcione

```bash
curl https://api.tu-dominio.com/api/docs
```

Deberías ver la documentación de Swagger.

---

## Paso 4: Configurar Auto-Deploy desde GitHub

### 4.1 Habilitar auto-deploy en CapRover

1. Ve a `aula-docente-api` → "Deployment"
2. En "Deploy Method" selecciona "GitHub"
3. Configura:
   - **Repository**: `TU-USUARIO/aula-docente`
   - **Branch**: `main`
4. Click "Save & Update"
5. CapRover te dará un webhook URL
6. Copia esa URL

### 4.2 Configurar el webhook en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Webhooks → "Add webhook"
3. Configura:
   - **Payload URL**: La URL que te dio CapRover
   - **Content type**: `application/json`
   - **Secret**: Deja vacío
   - **Events**: "Just the push event"
4. Click "Add webhook"

### 4.3 Probar el auto-deploy

```bash
# Haz un cambio pequeño en el código
echo "# Test" >> README.md
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

En CapRover deberías ver que se inicia un nuevo deploy automáticamente.

---

## Paso 5: Configurar CORS en la API

### 5.1 Actualizar la URL del frontend

En la API (`apps/api/src/main.ts`), asegúrate de que CORS esté configurado correctamente:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9000',
  credentials: true,
});
```

### 5.2 Actualizar la variable de entorno

En CapRover → `aula-docente-api` → Environment Variables:

```env
FRONTEND_URL=https://tu-frontend-en-netlify.com
```

### 5.3 Redeploy

Haz un push para que se redeploye la API con la nueva configuración.

---

## Paso 6: Configurar el Frontend para usar la API

### 6.1 Actualizar la URL de la API

En Netlify → `aula-docente` → Environment Variables:

```env
VITE_API_URL=https://api.tu-dominio.com
```

### 6.2 Verificar la configuración del frontend

En `apps/docente-app/src/boot/axios.ts`:

```typescript
import { boot } from 'quasar/wrappers';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
```

### 6.3 Redeploy del frontend

Haz un push para que Netlify redeploye el frontend con la nueva configuración.

---

## Paso 7: Verificar que todo funcione

### 7.1 Probar la API

```bash
# Verificar que la API responda
curl https://api.tu-dominio.com

# Verificar Swagger
curl https://api.tu-dominio.com/api/docs
```

### 7.2 Probar Adminer

1. Ve a `https://adminer.tu-dominio.com`
2. Ingresa las credenciales:
   - **Server**: `srv-captain--aula-docente-db`
   - **Username**: `aula_user`
   - **Password**: `<tu-contraseña>`
   - **Database**: `aula_docente`
3. Deberías poder ver las tablas

### 7.3 Probar el Frontend

1. Ve a `https://tu-frontend-en-netlify.com`
2. Intenta hacer login con:
   - Email: `admin@example.edu`
   - Password: `<la-que-configuraste-en-ADMIN_SEED_PASSWORD>`
3. Deberías poder acceder al sistema

### 7.4 Probar la PWA

1. Abre el frontend en tu celular
2. Toca "Agregar a pantalla de inicio"
3. Abre la app desde el ícono
4. Debería funcionar como app nativa

---

## Paso 8: Configurar Backups Automáticos

### 8.1 Crear script de backup

En tu servidor CapRover:

```bash
nano /root/backup-aula-docente.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/aula-docente"
mkdir -p $BACKUP_DIR

docker exec srv-captain--aula-docente-db pg_dump -U aula_user aula_docente > $BACKUP_DIR/backup_$DATE.sql

# Mantener solo los últimos 30 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completado: backup_$DATE.sql"
```

### 8.2 Hacer ejecutable el script

```bash
chmod +x /root/backup-aula-docente.sh
```

### 8.3 Configurar cron job

```bash
crontab -e
```

Agrega esta línea para ejecutar el backup diariamente a las 2 AM:

```cron
0 2 * * * /root/backup-aula-docente.sh >> /var/log/aula-docente-backup.log 2>&1
```

---

## Paso 9: Monitoreo y Logs

### 9.1 Ver logs de la API

En CapRover → `aula-docente-api` → "Logs"

### 9.2 Ver logs de PostgreSQL

En CapRover → `aula-docente-db` → "Logs"

### 9.3 Ver logs de Netlify

En Netlify → Site → "Deploys" → Click en el deploy → "Deploy log"

---

## Paso 10: Troubleshooting

### Problema: Las migraciones no se ejecutan

**Solución:**
1. Verifica que las variables de entorno estén configuradas en CapRover
2. Revisa los logs de la API en CapRover
3. Verifica que la base de datos esté accesible

### Problema: El frontend no conecta con la API

**Solución:**
1. Verifica que `VITE_API_URL` esté configurada en Netlify
2. Verifica que CORS esté configurado correctamente en la API
3. Verifica que ambos servicios tengan HTTPS habilitado

### Problema: Adminer no puede conectar

**Solución:**
1. Verifica que el servidor sea `srv-captain--aula-docente-db`
2. Verifica que las credenciales sean correctas
3. Verifica que PostgreSQL esté corriendo

---

## Checklist Final

- [ ] Código subido a GitHub
- [ ] Frontend desplegado en Netlify
- [ ] Backend desplegado en CapRover
- [ ] PostgreSQL configurado y corriendo
- [ ] Adminer configurado y protegido con password
- [ ] Variables de entorno configuradas en Netlify
- [ ] Variables de entorno configuradas en CapRover
- [ ] HTTPS habilitado en todos los servicios
- [ ] CORS configurado correctamente
- [ ] Auto-deploy configurado y probado
- [ ] PWA instalable y funcionando
- [ ] Backups automáticos configurados
- [ ] Admin seed ejecutado correctamente
- [ ] Migraciones ejecutadas correctamente
- [ ] Sistema probado end-to-end

---

## Comandos Útiles

### Git

```bash
# Ver estado
git status

# Ver logs
git log --oneline

# Hacer push
git add .
git commit -m "Mensaje del commit"
git push origin main
```

### Docker (en el servidor CapRover)

```bash
# Ver contenedores corriendo
docker ps

# Ver logs de un contenedor
docker logs -f srv-captain--aula-docente-api

# Reiniciar un contenedor
docker restart srv-captain--aula-docente-api

# Ejecutar comando en un contenedor
docker exec -it srv-captain--aula-docente-db psql -U aula_user aula_docente
```

### Base de datos

```bash
# Backup manual
docker exec srv-captain--aula-docente-db pg_dump -U aula_user aula_docente > backup.sql

# Restaurar backup
docker exec -i srv-captain--aula-docente-db psql -U aula_user aula_docente < backup.sql
```

---

## Soporte

Si tienes problemas:
1. Revisa los logs en CapRover y Netlify
2. Verifica que todas las variables de entorno estén configuradas
3. Consulta la documentación en `README.md`
4. Revisa los docs en `docs/`

---

¡Listo! Tu sistema está completamente desplegado y configurado para auto-deploy en cada push a GitHub.
