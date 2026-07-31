# Módulo: [nombre]

## Propósito

[Problema operativo que resuelve.]

## Alcance

### Incluye

- [Capacidad 1]
- [Capacidad 2]

### No incluye

- [Límite 1]

## Actores y permisos

| Actor | Consultar | Crear | Modificar | Resolver/Anular |
|---|---:|---:|---:|---:|
| Docente | Sí | Sí | Sí | Sí |
| Auxiliar | Sí | [Sí/No] | [Sí/No] | [Sí/No] |

## Entidades relacionadas

- `[entidad]`

## Reglas de negocio

1. [Regla verificable.]
2. [Regla verificable.]

## Casos de uso

### CU-01: [nombre]

- Actor: [actor].
- Precondiciones: [condiciones].
- Disparador: [acción].
- Flujo principal:
  1. [Paso.]
  2. [Paso.]
- Alternativas:
  - [Caso alternativo.]
- Resultado: [estado final].

## API prevista

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/...` | `[permiso]` | [Descripción] |

## Eventos de auditoría

- `[module.entity.created]`
- `[module.entity.updated]`

## Criterios de aceptación

- [ ] [Comportamiento observable.]
- [ ] [Validación de error.]

## Casos de prueba críticos

- [Caso feliz.]
- [Borde.]
- [Permiso denegado.]
- [Operación offline/conflicto.]

