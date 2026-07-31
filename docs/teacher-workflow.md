# Flujo Docente Operativo End-to-End

## Objetivo

Rediseñar la operación diaria de la app alrededor del flujo real del docente:

`periodo/semestre -> curso -> registro simple de estudiantes -> cronograma semanal -> agenda del día -> apertura de clase -> toma de lista secuencial -> clase en progreso -> actividades por clase -> escaneo QR para nota o firmas -> cierre de clase -> reportes`

El criterio rector es que la app priorice `Hoy` y `Clase actual` por encima de catálogos o CRUD genérico.

## Modelo funcional

### Periodo académico

- `AcademicPeriod` sigue siendo el semestre operativo.
- El docente debe crear o activar un semestre antes de operar.

### Curso

- El curso se crea por nombre visible y paralelo.
- Internamente puede seguir existiendo `Subject`, pero deja de ser un paso manual obligatorio en UX.
- `Course.schedule` representa el horario recurrente principal del curso.

### Estudiante

- El alta operativa mínima es `fullName`.
- El QR funciona como identificador operativo.
- Los campos heredados (`firstName`, `lastName`, `studentCode`) quedan como soporte técnico y compatibilidad.

### Inscripción

- `Enrollment` mantiene el vínculo curso-estudiante.
- Los reportes consolidados siempre parten de la inscripción del curso.

### Sesión de clase

- `ClassSession` es la unidad viva de operación.
- Estados operativos públicos:
  - `PLANNED`
  - `OPEN`
  - `COMPLETED`
  - `CANCELED`
- Regla: una sesión completada no admite nueva asistencia ni más registros QR.

### Actividades por sesión

- `Activity` pertenece a una `ClassSession`.
- `gradingMode`:
  - `SCORE_0_100`
  - `SIGNATURES`
- `SignatureRecord` acumula firmas.
- `ScoreRecord` registra o actualiza una nota 0-100 por estudiante y actividad.

### Asistencia

- La asistencia se registra por sesión.
- La falta justificada se guarda directamente como `JUSTIFIED` con texto breve.
- No pasa por aprobación posterior.

## Subgrupos por capacidad

Caso obligatorio a contemplar:

- Un curso de 40 estudiantes puede requerir dividirse en 2 subgrupos de 20.
- Cada subgrupo puede tener horario propio para una clase específica.
- La separación existe por limitación física del aula, no porque el curso deje de ser uno.

### Regla de diseño

- La división se modela como `ClassGroup` con membresías sobre `Enrollment`.
- Cada subgrupo puede tener su propio `schedule`.
- Las sesiones pueden estar asociadas a `classGroupId`.
- Si una sesión pertenece a un subgrupo, el roster de asistencia debe traer solo a los miembros de ese subgrupo.
- Los reportes finales deben poder unirse de nuevo a nivel curso, porque académicamente sigue siendo la misma materia/curso.

### Decisión

- La separación operativa y la consolidación académica son dos vistas de la misma realidad.
- Operación diaria:
  - ver la clase correcta
  - ver solo los estudiantes correctos
  - respetar el horario correcto
- Consolidado:
  - mismo curso
  - mismo periodo
  - mismos reportes agregados

## Contratos API deseados

### Configuración

- `GET /teacher-workflow/periods`
- `POST /teacher-workflow/periods`
- `PUT /teacher-workflow/periods/:id`
- `GET /teacher-workflow/courses`
- `POST /teacher-workflow/courses`
- `PUT /teacher-workflow/courses/:id`

### Estudiantes y matrícula

- `POST /teacher-workflow/courses/:courseId/students`
- `POST /teacher-workflow/courses/:courseId/students/bulk`
- `GET /teacher-workflow/courses/:courseId/students?page=n`

### Horarios y subgrupos

- `PUT /teacher-workflow/courses/:courseId/schedule`
- `GET /teacher-workflow/courses/:courseId/groups`
- `POST /teacher-workflow/courses/:courseId/groups`
- `POST /teacher-workflow/courses/:courseId/additional-sessions`

### Operación diaria

- `GET /teacher-workflow/today?date=YYYY-MM-DD`
- `GET /teacher-workflow/current-session`
- `POST /teacher-workflow/sessions/:sessionId/open`
- `GET /teacher-workflow/sessions/:sessionId/roster`
- `POST /teacher-workflow/sessions/:sessionId/attendance`
- `POST /teacher-workflow/sessions/:sessionId/complete`

### Actividades y QR

- `GET /teacher-workflow/sessions/:sessionId/activities`
- `POST /teacher-workflow/sessions/:sessionId/activities`
- `PATCH /teacher-workflow/activities/:activityId`
- `POST /teacher-workflow/activities/:activityId/scan`

## Wireflow móvil

### Hoy

- Muestra solo clases del día.
- Si hay una clase abierta, domina la pantalla.
- CTA principal:
  - `Tomar lista`
  - `Continuar clase`

### Cursos

- Lista cursos del docente.
- Desde el detalle del curso se configura:
  - estudiantes
  - horario semanal
  - subgrupos
  - sesiones adicionales

### Clase actual

- Recupera la sesión abierta aunque se cierre la app.
- Muestra actividades de la sesión.
- Permite crear actividad y completar clase.

### Toma de lista

- Un estudiante por vez.
- Acciones:
  - `Asistió`
  - `Faltó`
  - `Falta justificada`
- Si es justificada, pide texto antes de avanzar.

### Escáner QR

- No pide contexto ambiguo si ya existe clase y actividad activas.
- Si la actividad es de nota:
  - escanear
  - confirmar estudiante
  - guardar nota 0-100
- Si la actividad es de firmas:
  - escanear
  - acumular firmas

## Reglas operativas

- Una sola sesión abierta por bloque/horario.
- Una sesión completada no se reabre.
- Agenda diaria ordenada por hora, incluyendo adicionales.
- Los flujos pequeños no se paginan:
  - agenda del día
  - roster de sesión abierta
  - actividades visibles de la clase actual
- Los listados históricos sí se paginan:
  - cursos
  - estudiantes por curso
  - sesiones históricas
  - actividades históricas
  - reportes

## Implementación aterrizada en este ciclo

- Nuevo módulo backend `teacher-workflow` orientado a caso de uso.
- Agenda diaria materializada desde horario recurrente.
- Soporte base para subgrupos con horario propio y sesiones asociadas.
- Roster secuencial filtrado por subgrupo cuando la sesión pertenece a uno.
- Actividades por sesión con `gradingMode`.
- Nuevo `ScoreRecord`.
- Pantallas móviles reorganizadas alrededor de:
  - `Hoy`
  - `Cursos`
  - `Clase actual`
  - `Reportes`
  - `Más`

## Brechas pendientes / backlog

- Pantalla específica de creación/edición de semestre en frontend.
- UX dedicada para repartir estudiantes entre subgrupos con selección múltiple.
- Persistencia explícita de “actividad activa” si existen varias abiertas por sesión.
- Reportes consolidados nuevos:
  - historial por sesión
  - consolidado por actividad
  - acumulado de firmas por estudiante
  - notas por actividad y promedio por curso
  - faltas y faltas justificadas por periodo
- Validaciones más finas para solapamiento de bloques y reaprovechamiento de aulas.
- Mejor soporte offline para el nuevo workflow.

## Escenarios críticos

- Crear semestre, curso y estudiantes solo con nombre completo.
- Definir varios bloques semanales para un mismo curso.
- Crear clase adicional y verla en la agenda del día.
- Abrir sesión, salir de la app y recuperar la clase en progreso.
- Tomar lista completa en modo secuencial.
- Registrar falta justificada con texto.
- Crear actividad de nota y registrar QR con score.
- Crear actividad de firmas y acumular varias firmas.
- Dividir un curso en dos subgrupos con horarios propios y verificar que el roster no mezcle estudiantes.
