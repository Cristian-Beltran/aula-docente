# R2 Cloudflare - Almacenamiento de evidencias y fotografías

## Configuración

R2 es el servicio de almacenamiento compatible con S3 que se utiliza para:
- Fotografías de estudiantes
- Evidencias adjuntas a excepciones
- Documentos exportados (reportes PDF/Excel)

## Variables de entorno

```env
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key
R2_SECRET_ACCESS_KEY=tu_secret_key
R2_BUCKET_NAME=aula-docente
R2_PUBLIC_URL=https://cdn.tu-dominio.com
```

## Bucket recomendado

Nombre: `aula-docente`

Estructura de carpetas dentro del bucket:
```
aula-docente/
├── students/
│   └── {student_id}/
│       └── photo.jpg
├── exceptions/
│   └── {exception_id}/
│       ├── evidence_1.pdf
│       └── evidence_2.jpg
└── reports/
    └── {course_id}/
        └── report_2026.pdf
```

## Configuración en Cloudflare Dashboard

1. Ir a R2 en el dashboard de Cloudflare
2. Crear bucket `aula-docente`
3. Generar credenciales de API Token con permisos:
   - `Object Read/Write` en el bucket
4. Configurar dominio público (opcional):
   - Crear Custom Domain para acceso directo
   - O usar URLs firmadas para acceso privado

## URLs firmadas

Para evidencias privadas, usar URLs firmadas con expiración:
```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const command = new GetObjectCommand({
  Bucket: 'aula-docente',
  Key: 'exceptions/uuid/evidence.pdf',
});

const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
```

## Límites

- Tamaño máximo de archivo: 5GB (límite de R2)
- Recomendado: 10MB para fotografías, 50MB para evidencias
- Sin costos de egress (ventaja principal de R2)
