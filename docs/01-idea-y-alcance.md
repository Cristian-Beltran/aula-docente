# 01. Idea, alcance y reglas

## Problema

La docente registra firmas manuales por prácticas y toma asistencia en cursos que, para laboratorio, se dividen en dos o más grupos. El sistema institucional suele tratar esos grupos como cursos distintos, obligando a contar, corregir y consolidar la información manualmente al final del periodo.

## Solución

Aula Docente mantiene un único curso académico y permite crear subdivisiones operativas. Cada práctica o clase común puede tener varias sesiones reales, una por grupo y horario. El sistema registra asistencia, firmas y excepciones por sesión, pero consolida los resultados por curso y actividad.

La aplicación será móvil-first y se distribuirá como:

- Aplicación web responsive.
- PWA instalable.
- Aplicación Android mediante Capacitor.

## Objetivo del producto

Reducir el tiempo y los errores de:

- Registrar firmas durante prácticas.
- Tomar asistencia.
- Trabajar con grupos de laboratorio.
- Gestionar recuperaciones y cambios de grupo.
- Revisar justificantes.
- Consolidar resultados.
- Generar reportes de fin de semestre.

## Actores

### Docente

Administra sus periodos, cursos, estudiantes, grupos, sesiones, actividades, firmas, asistencias, excepciones y reportes.

### Auxiliar

Puede ejecutar acciones autorizadas sobre cursos asignados, por ejemplo tomar asistencia o registrar firmas. No puede cerrar periodos ni modificar reglas de calificación salvo permiso expreso.

### Estudiante

En el MVP no requiere una cuenta. Se identifica mediante un QR seguro asociado a su inscripción. En una fase posterior podrá consultar su información y presentar solicitudes.

### Administrador

Gestiona usuarios, permisos, catálogos y auditoría global cuando el producto admita varias docentes.

## Estructura académica

```text
Periodo académico
└── Curso: Electrónica I - Paralelo A
    ├── Lista oficial: 40 estudiantes
    ├── Grupo LAB-1: 20 estudiantes
    ├── Grupo LAB-2: 20 estudiantes
    ├── Clase planificada: Laboratorio 4
    │   ├── Sesión LAB-1: martes 08:00
    │   └── Sesión LAB-2: jueves 10:00
    └── Actividad: Práctica 4
```

El grupo no crea una segunda inscripción. Solo determina quién debe asistir a una sesión concreta.

## Módulos

### MVP

1. Autenticación y perfil.
2. Periodos académicos.
3. Materias y cursos.
4. Estudiantes e inscripciones.
5. Grupos internos.
6. Clases planificadas y sesiones.
7. Actividades y firmas.
8. Asistencia.
9. Excepciones y justificantes.
10. QR individual.
11. Reportes y exportación.
12. Auditoría básica.
13. Operación offline limitada.

### Evolución

- Libro de calificaciones.
- Rúbricas.
- Alertas académicas.
- Planificación de clases.
- Portal del estudiante.
- Comunicados.
- Grupos de proyectos.
- Inventario y préstamos de laboratorio.

## Reglas de negocio

### Cursos y grupos

- Una inscripción es única por estudiante y curso.
- Un grupo pertenece a un solo curso.
- Un estudiante puede pertenecer a distintos tipos de grupo.
- Para un mismo tipo de división, el estudiante solo puede estar activo en un grupo a la vez.
- Un cambio de grupo cierra la membresía anterior; no borra el historial.
- Una sesión sin grupo corresponde al curso completo.
- Una sesión con grupo muestra por defecto solo a sus integrantes.

### Firmas

- Una firma es un movimiento, no un contador editable.
- Cada actividad define el máximo de firmas por estudiante.
- Las firmas anuladas permanecen en el historial.
- La anulación exige motivo y usuario responsable.
- El sistema ignora relecturas accidentales del mismo QR dentro de una ventana configurable.
- Una actividad cerrada no acepta registros ordinarios.
- Una excepción autorizada puede permitir una recuperación fuera del grupo o fecha original.

### Asistencia

- Existe un solo registro de asistencia por estudiante y sesión.
- Los estados base son: presente, retraso, ausente, justificado y salida anticipada.
- El sistema puede calcular presente o retraso según la hora de entrada.
- El cierre de una sesión marca como ausentes a los estudiantes esperados sin registro, previa confirmación.
- Una justificación aprobada cambia la condición efectiva, pero conserva el estado original y la trazabilidad.

### Excepciones

Una excepción representa una desviación autorizada del flujo normal, por ejemplo:

- Asistencia con otro grupo.
- Recuperación de práctica.
- Registro después del cierre.
- Corrección de una asistencia.
- Firma manual por falla de cámara.
- Justificación de ausencia.

Toda excepción debe registrar tipo, motivo, evidencia opcional, solicitante, aprobador, fecha y estado.

### QR y seguridad

- El QR identifica una inscripción, no autoriza acciones.
- Solo usuarios autenticados registran firmas o asistencia.
- El QR contiene un token aleatorio, nunca datos personales.
- Solo se almacena el hash del token.
- Un QR revocado deja de funcionar de inmediato cuando hay conexión.
- Las acciones offline se firman localmente con el usuario y dispositivo que las originó y se validan al sincronizar.

## Criterios de éxito del MVP

- Registrar una firma válida en menos de tres segundos.
- Evitar duplicados accidentales.
- Consolidar LAB-1 y LAB-2 sin intervención manual.
- Obtener el total de firmas y asistencia por estudiante.
- Registrar recuperaciones sin alterar el grupo oficial.
- Adjuntar y resolver justificantes.
- Exportar un resumen por curso y otro por grupo.
- Recuperar la trazabilidad de cualquier corrección.

## Fuera de alcance inicial

- Plataforma completa de enseñanza virtual.
- Videoconferencia.
- Entrega masiva de archivos como Moodle.
- Pagos.
- Mensajería en tiempo real.
- Autoasistencia abierta sin supervisión.

