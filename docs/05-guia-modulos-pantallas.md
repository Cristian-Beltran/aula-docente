# 05. Guía de módulos y pantallas

## Navegación principal móvil

- Inicio.
- Escanear.
- Cursos.
- Alertas.
- Más.

El botón `Escanear` debe ser la acción visual principal.

## Login

### Contenido

- Marca y nombre del sistema.
- Correo.
- Contraseña.
- Mostrar/ocultar contraseña.
- Recordar sesión en dispositivo confiable.
- Recuperar contraseña.
- Indicador de conectividad.

### Estados

- Inicial.
- Cargando.
- Credenciales incorrectas.
- Sin conexión.
- Sesión vencida.

## Inicio

### Información de hoy

- Próxima clase.
- Sesiones activas.
- Firmas registradas hoy.
- Asistencia pendiente de cerrar.
- Excepciones por revisar.
- Estado de sincronización.

### Acciones rápidas

- Escanear firma.
- Tomar asistencia.
- Crear sesión.
- Buscar estudiante.
- Registrar excepción.

## Cursos

- Lista por periodo.
- Filtro por estado.
- Crear curso.
- Resumen de estudiantes, grupos y avance.
- Cerrar o archivar curso.

## Crear curso

Pasos:

1. Periodo y materia.
2. Paralelo y modalidad.
3. Horarios.
4. Reglas de asistencia.
5. Confirmación.

## Estudiantes e inscripciones

- Lista oficial.
- Búsqueda.
- Registro manual.
- Importación CSV/XLSX.
- Validación de duplicados.
- Retiro.
- Perfil e historial.
- Generación y regeneración de QR.

## Grupos

- Crear tipo de grupo.
- Generar dos o más grupos.
- Distribución equilibrada.
- Arrastrar o seleccionar estudiantes.
- Mostrar estudiantes sin grupo.
- Cambiar estudiante con fecha efectiva.
- Consultar historial.

## Clases y sesiones

- Calendario y agenda.
- Crear clase planificada.
- Ejecutar para curso completo o grupos.
- Abrir, cerrar o cancelar sesión.
- Tema planificado y tema avanzado.
- Lista de estudiantes esperados.

## Escáner

### Encabezado fijo

- Curso.
- Sesión.
- Actividad.
- Modo: firma o asistencia.
- Conectividad.

### Resultado

- Fotografía.
- Nombre y código.
- Grupo oficial.
- Acción registrada.
- Total actual.
- Advertencias.
- Deshacer temporal.

## Asistencia

- Lista por estado.
- Check-in QR.
- Marcado manual.
- Cambio masivo.
- Retrasos.
- Cierre y ausencias propuestas.
- Justificación.

## Firmas

- Actividades abiertas.
- Total por estudiante.
- Historial de movimientos.
- Registro QR/manual.
- Anulación con motivo.
- Máximo configurable.

## Excepciones

- Bandeja pendiente.
- Tipo y prioridad.
- Estudiante, curso, actividad y sesión.
- Motivo.
- Evidencias.
- Aprobar, rechazar o solicitar información.
- Historial de resolución.

## Reportes

- Consolidado del curso.
- Comparación por grupos.
- Firmas por actividad.
- Asistencia por clase.
- Estudiantes en riesgo.
- Excepciones y recuperaciones.
- Exportación Excel/PDF.

## Lenguaje visual: cálida académica

- Fondo marfil claro.
- Azul institucional para navegación y confianza.
- Coral como acción principal y confirmación.
- Verde tenue para éxito.
- Ámbar para advertencias.
- Tarjetas redondeadas con sombras suaves.
- Tipografía legible, botones táctiles de al menos 44 px.
- Información crítica visible sin depender únicamente del color.

## Convención para nuevas pantallas

Cada pantalla nueva debe documentarse usando `templates/pantalla.template.md` y definir:

- Objetivo.
- Rol autorizado.
- Datos necesarios.
- Acciones principales.
- Estados vacíos, carga, error y offline.
- Reglas de validación.
- Eventos de auditoría.
- Criterios responsive y accesibilidad.

