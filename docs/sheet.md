Especificación: Google Sheets informativo por materia

1. Objetivo

Implementar en la aplicación Vue + NestJS una integración unidireccional:

Aplicación (PostgreSQL) → Google Sheets

PostgreSQL es la fuente oficial. Google Sheets sirve únicamente para consultarasistencia, bitácora, notas y firmas. Los cambios manuales realizados en elarchivo no se importan a la aplicación y pueden ser reemplazados en la siguientesincronización.

Debe existir un archivo de Google Sheets por materia/curso.

2. Decisión sobre las credenciales

No crear una API key distinta por clase o materia.

La configuración se divide en dos niveles:

Credenciales globales de Google

Se configuran una sola vez.

Solo un administrador o docente propietario puede modificarlas.

Se almacenan cifradas en el backend.

Nunca se envían nuevamente al frontend.

Vínculo por materia

Cada materia guarda su propio spreadsheetId.

También guarda la URL, versión de plantilla, fecha de última sincronizacióny estado.

La pantalla global debe llamarse:

Configuración → Integraciones → Google Sheets

Campos:

projectId

clientEmail

privateKey

correo de Google del docente con quien se compartirá el archivo

estado de la conexión

fecha de última validación

Acciones:

Guardar credenciales

Probar conexión

Reemplazar credenciales

Desconectar

La clave privada debe mostrarse como campo secreto. Después de guardarla, elbackend solo devolverá configured: true; nunca devolverá la clave original.

Si en el futuro cada docente necesita ser propietario directo de los archivosen su Google Drive, se deberá sustituir esta configuración por OAuth 2.0 conel botón “Conectar con Google”. Para una instalación controlada por un solodocente, la cuenta de servicio es la implementación inicial más simple.

3. Apartado Google Sheets dentro de cada materia

Agregar a la vista de configuración o detalle de la materia una tarjeta:

Google Sheets de la materia

Debe mostrar:

Estado: No configurado, Creando, Sincronizado, Pendiente o Error.

Nombre del archivo.

URL del archivo.

Última sincronización.

Última clase incluida.

Mensaje del último error, si existe.

Acciones:

Crear Google Sheet

Vincular Sheet existente

Abrir Google Sheet

Sincronizar ahora

Recrear estructura

Desvincular

Crear Google Sheet debe:

Verificar que las credenciales globales funcionen.

Verificar que la materia todavía no tenga un archivo asociado.

Crear el archivo con el nombre:

{Materia} - {Gestión} - {Grupo}

Crear y ordenar las cuatro pestañas definidas en esta especificación.

Aplicar encabezados, colores, bordes, filtros, columnas congeladas,combinaciones de celdas y rangos protegidos.

Compartir el archivo con el correo configurado para el docente.

Exportar todos los datos actuales de la materia.

Guardar spreadsheetId, URL y versión de plantilla en PostgreSQL.

Vincular Sheet existente recibe una URL o spreadsheetId. Antes de aceptarlo,el backend debe comprobar acceso de escritura y luego construir nuevamente laestructura oficial dentro del archivo.

4. Estructura obligatoria del archivo

El archivo tendrá exactamente estas cuatro pestañas, en este orden:

Asistencia

Clases - Bitácora

Detalle

Resumen

No crear una pestaña de parciales.

4.1. Asistencia

Formato matricial:

Primera columna: Estudiante.

Después, una columna por clase cerrada.

Las columnas se agrupan visualmente por:

Parcial 1 | Parcial 2 | Parcial Final

Cada encabezado de clase contiene fecha y nombre o número de clase.

Valores permitidos:

P: presente.

A: ausente.

J: ausencia justificada.

T: tardanza, si el sistema ya utiliza este estado.

No calcular una asistencia global mezclando los tres parciales. Si se muestranporcentajes, deben ser independientes por parcial.

4.2. Clases - Bitácora

Una fila por clase cerrada:

Campo

Contenido

Parcial

Parcial 1, Parcial 2 o Parcial Final

Fecha

Fecha de la clase

Clase

Número o título

Tema

Tema principal

Bitácora

Resumen del contenido desarrollado

Actividades

Nombres de las actividades realizadas

Observaciones

Observaciones del docente

Cerrada el

Fecha y hora de cierre

4.3. Detalle

La primera columna será siempre:

Estudiante

El resto usa un encabezado jerárquico de tres niveles:

Parcial → Clase y fecha → Actividad

Ejemplo conceptual:

Parcial 1
└── Clase 03 - 15/08/2026
    ├── Práctica de sensores (Nota)
    └── Participación (Firmas)

Regla obligatoria:

Cada actividad ocupa una sola columna.

Cada actividad tiene un único tipo:

NOTA, o

FIRMAS.

Una actividad nunca puede tener nota y firmas al mismo tiempo.

Si una clase requiere ambas métricas, se crean dos actividades distintas.

El valor de una celda será:

La nota, cuando la actividad sea NOTA.

El número de firmas, cuando la actividad sea FIRMAS.

Vacío cuando el estudiante no tenga resultado.

4.4. Resumen

Primera columna:

Estudiante

Cada parcial debe ser independiente y mostrar únicamente:

Parcial

Indicadores

Parcial 1

Firmas totales, Promedio de notas

Parcial 2

Firmas totales, Promedio de notas

Parcial Final

Firmas totales, Promedio de notas

Reglas:

Firmas totales: suma únicamente actividades de tipo FIRMAS pertenecientesal parcial.

Promedio de notas: promedio únicamente de actividades de tipo NOTApertenecientes al parcial.

No incluir Actividades calificadas.

No incluir promedio general.

No sumar firmas de los tres parciales.

No crear una columna total que mezcle los parciales.

5. Gestión de parciales dentro de la aplicación

Aunque el Sheet no tenga una pestaña de parciales, la aplicación sí debe guardarlos periodos en PostgreSQL.

Cada materia tendrá exactamente:

PARCIAL_1

PARCIAL_2

FINAL

Cada periodo tendrá:

fecha inicial;

fecha final;

estado OPEN o CLOSED;

fecha de cierre opcional.

Reglas:

Las fechas de los periodos no pueden solaparse.

La fecha inicial debe ser menor o igual a la fecha final.

Una clase debe pertenecer exactamente a un parcial.

Al crear o cambiar la fecha de una clase abierta, el sistema asignaautomáticamente el parcial según la fecha.

La actividad hereda el parcial de su clase; el usuario no lo elige otra vez.

Una clase no puede cerrarse si su fecha no pertenece a ningún parcial.

Cuando una clase está cerrada, su parcial queda congelado.

Para mover una clase cerrada a otro parcial primero debe reabrirse, si el roldel usuario tiene ese permiso.

La configuración de estas fechas debe estar en:

Materia → Configuración → Fechas de parciales

No es necesario marcar manualmente “fin de parcial” en cada clase. Cerrar unaclase y cerrar un parcial son operaciones distintas.

6. Modelo de datos mínimo

google_integration_settings

id
owner_user_id
project_id
service_account_email
encrypted_private_key
share_with_email
status
last_validated_at
created_at
updated_at

Debe existir como máximo una configuración activa por propietario o institución.

course_spreadsheets

id
course_id                    UNIQUE
google_integration_setting_id
spreadsheet_id               UNIQUE
spreadsheet_url
spreadsheet_name
template_version
status
last_synced_at
last_synced_class_id
last_error
created_at
updated_at

academic_periods

id
course_id
type                         PARCIAL_1 | PARCIAL_2 | FINAL
starts_on
ends_on
status                       OPEN | CLOSED
closed_at
created_at
updated_at

Restricción única:

UNIQUE(course_id, type)

sheet_sync_jobs

id
course_id
class_id                     NULL cuando es sincronización manual
reason                       SHEET_CREATED | CLASS_CLOSED | MANUAL | REBUILD
revision
status                       PENDING | PROCESSING | COMPLETED | FAILED
attempts
last_error
created_at
started_at
completed_at

La tabla debe impedir el procesamiento duplicado de la misma revisión:

UNIQUE(course_id, class_id, revision, reason)

7. Módulo NestJS

Crear un módulo independiente:

src/modules/google-sheets/
├── google-sheets.module.ts
├── controllers/
│   ├── google-integration.controller.ts
│   └── course-spreadsheet.controller.ts
├── services/
│   ├── google-auth.service.ts
│   ├── spreadsheet-creator.service.ts
│   ├── spreadsheet-template.service.ts
│   ├── course-sheet-data.service.ts
│   ├── course-sheet-sync.service.ts
│   └── spreadsheet-permission.service.ts
├── workers/
│   └── course-sheet-sync.worker.ts
├── entities/
│   ├── google-integration-setting.entity.ts
│   ├── course-spreadsheet.entity.ts
│   └── sheet-sync-job.entity.ts
└── dto/

Responsabilidades:

google-auth.service: crea el cliente autenticado de Google.

spreadsheet-creator.service: crea o vincula el archivo.

spreadsheet-template.service: conserva las cuatro pestañas y su formato.

course-sheet-data.service: consulta y transforma los datos académicos.

course-sheet-sync.service: ejecuta la exportación completa.

spreadsheet-permission.service: comparte el archivo con el docente.

course-sheet-sync.worker: procesa reintentos fuera de la petición HTTP.

Dependencia:

pnpm add googleapis

Habilitar en Google Cloud:

Google Sheets API.

Google Drive API.

8. Endpoints

Configuración global

PUT    /integrations/google-sheets/credentials
POST   /integrations/google-sheets/test
GET    /integrations/google-sheets/status
DELETE /integrations/google-sheets/credentials

Por materia

POST   /courses/:courseId/google-sheet
POST   /courses/:courseId/google-sheet/link
GET    /courses/:courseId/google-sheet
POST   /courses/:courseId/google-sheet/sync
POST   /courses/:courseId/google-sheet/rebuild
DELETE /courses/:courseId/google-sheet

Cierre de clase

POST /classes/:classId/close

Respuesta recomendada:

{
  "classId": "uuid",
  "status": "CLOSED",
  "sheetSync": {
    "status": "PENDING",
    "jobId": "uuid"
  }
}

9. Sincronización automática al cerrar una clase

El cierre debe seguir este flujo:

Validar que la clase esté abierta.

Validar asistencia.

Validar actividades y resultados.

Validar que cada actividad sea NOTA o FIRMAS, nunca ambas.

Validar que la clase pertenezca a un parcial.

Guardar todos los cambios en PostgreSQL.

Marcar la clase como CLOSED y establecer closedAt.

Crear un trabajo CLASS_CLOSED en sheet_sync_jobs.

Confirmar la transacción.

Procesar la actualización del Sheet en segundo plano.

El cierre de la clase no debe quedar bloqueado si Google no responde. En esecaso, la clase queda cerrada y la sincronización queda como FAILED oPENDING_RETRY.

Reintentos recomendados:

1 minuto → 5 minutos → 15 minutos → 1 hora

Después del último fallo:

mostrar el estado Error de sincronización en la materia;

conservar el mensaje técnico en el backend;

permitir Sincronizar ahora.

Procesar un solo trabajo a la vez por materia para evitar que dos cierresescriban simultáneamente el mismo archivo.

10. Estrategia de actualización

Para este sistema académico, usar una reconstrucción completa del contenidoen cada sincronización. Es más simple y confiable que intentar modificar celdasindividuales.

Cada sincronización debe:

Consultar todos los estudiantes activos de la materia.

Consultar todas las clases cerradas.

Consultar asistencias.

Consultar actividades de tipo NOTA y FIRMAS.

Consultar resultados y firmas.

Construir los cuatro modelos tabulares.

Verificar nombres, orden y encabezados de las pestañas.

Reparar la estructura si fue modificada.

Limpiar únicamente los rangos administrados por la aplicación.

Escribir valores por lotes.

Aplicar nuevamente formato, celdas combinadas y protección.

Actualizar lastSyncedAt, lastSyncedClassId y templateVersion.

Usar una constante:

export const COURSE_SHEET_TEMPLATE_VERSION = 1;

La aplicación debe ignorar pestañas adicionales creadas por el usuario, perodebe restaurar las cuatro pestañas oficiales si fueron renombradas, eliminadaso alteradas.

11. Reglas de cálculo

Para un estudiante y parcial:

firmasTotales =
  SUMA(resultados de actividades cuyo tipo sea FIRMAS)

promedioNotas =
  PROMEDIO(resultados no vacíos de actividades cuyo tipo sea NOTA)

Reglas adicionales:

Una ausencia no debe convertirse automáticamente en nota cero, salvo que laregla académica de la materia lo indique expresamente.

Un resultado vacío no participa en el promedio.

Un cero registrado sí participa en el promedio.

El backend calcula los valores del resumen; no depender exclusivamente defórmulas editables del Sheet.

Redondeo recomendado: dos decimales.

12. Seguridad

Solo el backend se comunica con Google.

Vue nunca recibe privateKey.

Cifrar privateKey antes de almacenarla.

No registrar la clave en logs.

No incluir credenciales en respuestas de error.

Proteger los endpoints con rol de administrador o docente propietario.

Verificar que la materia pertenece al usuario antes de crear, vincular,sincronizar o desvincular un Sheet.

Registrar auditoría de creación, reconstrucción, sincronización ydesvinculación.

El Sheet no debe contener contraseñas, tokens, QR secretos ni datos internosde sesión.

13. Componentes Vue

src/modules/google-sheets/
├── api/googleSheets.api.ts
├── components/
│   ├── GoogleCredentialsForm.vue
│   ├── GoogleConnectionStatus.vue
│   ├── CourseSpreadsheetCard.vue
│   └── SheetSyncStatus.vue
├── composables/useGoogleSheets.ts
├── stores/googleSheets.store.ts
└── views/GoogleSheetsSettingsView.vue

Al cerrar una clase:

mostrar confirmación;

informar que después del cierre se actualizará el Sheet;

deshabilitar doble clic mientras se procesa;

mostrar Clase cerrada. Actualización de Google Sheets pendiente;

actualizar el estado cuando el trabajo termine;

no obligar al usuario a esperar la respuesta de Google.

14. Pruebas obligatorias

Unitarias

Una actividad acepta nota o firmas, nunca ambas.

El promedio ignora vacíos y considera ceros.

Las firmas se suman solo dentro de su parcial.

Las notas se promedian solo dentro de su parcial.

Una fecha se asigna al parcial correcto.

Se rechazan periodos solapados.

Integración

Guardar credenciales y comprobar que la clave no vuelve al frontend.

Crear un Sheet con exactamente las cuatro pestañas oficiales.

Crear solo un Sheet por materia.

Cerrar una clase genera un solo trabajo de sincronización.

Repetir el evento no duplica el trabajo.

Un fallo de Google no revierte el cierre de la clase.

El reintento completa un trabajo fallido.

La reconstrucción restaura encabezados modificados.

End-to-end

Configurar Google.

Crear una materia y sus tres rangos de parciales.

Crear el Sheet.

Registrar estudiantes.

Crear una clase con asistencia.

Crear una actividad de nota.

Crear otra actividad de firmas.

Cerrar la clase.

Verificar la actualización de las cuatro pestañas.

Confirmar que Resumen no contiene un total general niActividades calificadas.

15. Criterios de aceptación

Existe una configuración segura de credenciales de Google.

No se solicitan credenciales distintas por clase o materia.

Cada materia puede crear o vincular un único Google Sheet.

El sistema construye automáticamente Asistencia, Clases - Bitácora,Detalle y Resumen.

El formato se conserva o se repara en cada sincronización.

Las actividades tienen un único tipo de resultado.

Los tres parciales se mantienen separados.

No existe una pestaña de parciales.

No existe un total acumulado de los tres parciales.

No existe el indicador Actividades calificadas.

Al cerrar una clase se crea automáticamente una sincronización.

Un fallo de Google no ocasiona pérdida de datos ni impide cerrar la clase.

El usuario puede ver el estado y reintentar manualmente.

16. Orden recomendado de implementación

Crear migraciones y entidades.

Implementar configuración cifrada de credenciales.

Implementar validación de parciales.

Implementar cliente de Google Sheets y Google Drive.

Implementar creador de archivos.

Implementar el constructor de las cuatro pestañas.

Implementar exportación completa por materia.

Integrar el evento con el cierre de clase.

Implementar trabajos, bloqueo por materia y reintentos.

Crear las vistas Vue.

Añadir pruebas unitarias, de integración y end-to-end.

17. Referencias oficiales

Crear un archivo mediante Sheets API:https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/create

Actualizar estructura, formato y rangos por lotes:https://developers.google.com/workspace/sheets/api/guides/batchupdate

Crear permisos para compartir el archivo:https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions/create

Límites y estrategia de reintentos:https://developers.google.com/workspace/sheets/api/limits
