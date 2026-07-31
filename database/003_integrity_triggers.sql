BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'academic_periods',
    'subjects',
    'courses',
    'students',
    'enrollments',
    'class_groups',
    'lessons',
    'class_sessions',
    'activities',
    'exception_requests',
    'attendance_records'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION validate_group_membership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  group_course_id uuid;
  enrollment_course_id uuid;
  current_group_type group_type;
BEGIN
  SELECT course_id, type
    INTO group_course_id, current_group_type
  FROM class_groups
  WHERE id = NEW.class_group_id;

  SELECT course_id
    INTO enrollment_course_id
  FROM enrollments
  WHERE id = NEW.enrollment_id;

  IF group_course_id IS DISTINCT FROM enrollment_course_id THEN
    RAISE EXCEPTION 'La inscripción y el grupo deben pertenecer al mismo curso';
  END IF;

  IF NEW.removed_at IS NULL AND EXISTS (
    SELECT 1
    FROM group_memberships gm
    JOIN class_groups cg ON cg.id = gm.class_group_id
    WHERE gm.enrollment_id = NEW.enrollment_id
      AND gm.removed_at IS NULL
      AND cg.course_id = group_course_id
      AND cg.type = current_group_type
      AND gm.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'El estudiante ya tiene un grupo activo de este tipo en el curso';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER group_memberships_validate
BEFORE INSERT OR UPDATE ON group_memberships
FOR EACH ROW EXECUTE FUNCTION validate_group_membership();

CREATE OR REPLACE FUNCTION validate_class_session_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  lesson_course_id uuid;
  group_course_id uuid;
BEGIN
  SELECT course_id INTO lesson_course_id
  FROM lessons
  WHERE id = NEW.lesson_id;

  IF lesson_course_id IS DISTINCT FROM NEW.course_id THEN
    RAISE EXCEPTION 'La clase planificada y la sesión deben pertenecer al mismo curso';
  END IF;

  IF NEW.class_group_id IS NOT NULL THEN
    SELECT course_id INTO group_course_id
    FROM class_groups
    WHERE id = NEW.class_group_id;

    IF group_course_id IS DISTINCT FROM NEW.course_id THEN
      RAISE EXCEPTION 'El grupo y la sesión deben pertenecer al mismo curso';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER class_sessions_validate_scope
BEFORE INSERT OR UPDATE ON class_sessions
FOR EACH ROW EXECUTE FUNCTION validate_class_session_scope();

CREATE OR REPLACE FUNCTION validate_attendance_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session_course_id uuid;
  enrollment_course_id uuid;
BEGIN
  SELECT course_id INTO session_course_id
  FROM class_sessions
  WHERE id = NEW.class_session_id;

  SELECT course_id INTO enrollment_course_id
  FROM enrollments
  WHERE id = NEW.enrollment_id;

  IF session_course_id IS DISTINCT FROM enrollment_course_id THEN
    RAISE EXCEPTION 'La asistencia debe corresponder al mismo curso de la sesión';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER attendance_records_validate_scope
BEFORE INSERT OR UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION validate_attendance_scope();

CREATE OR REPLACE FUNCTION validate_signature_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  activity_course_id uuid;
  enrollment_course_id uuid;
  session_course_id uuid;
  group_course_id uuid;
  valid_total integer;
  allowed_total integer;
BEGIN
  SELECT course_id, max_signatures
    INTO activity_course_id, allowed_total
  FROM activities
  WHERE id = NEW.activity_id;

  SELECT course_id INTO enrollment_course_id
  FROM enrollments
  WHERE id = NEW.enrollment_id;

  IF activity_course_id IS DISTINCT FROM enrollment_course_id THEN
    RAISE EXCEPTION 'La actividad y la inscripción deben pertenecer al mismo curso';
  END IF;

  IF NEW.class_session_id IS NOT NULL THEN
    SELECT course_id INTO session_course_id
    FROM class_sessions
    WHERE id = NEW.class_session_id;

    IF session_course_id IS DISTINCT FROM activity_course_id THEN
      RAISE EXCEPTION 'La sesión y la actividad deben pertenecer al mismo curso';
    END IF;
  END IF;

  IF NEW.class_group_id IS NOT NULL THEN
    SELECT course_id INTO group_course_id
    FROM class_groups
    WHERE id = NEW.class_group_id;

    IF group_course_id IS DISTINCT FROM activity_course_id THEN
      RAISE EXCEPTION 'El grupo y la actividad deben pertenecer al mismo curso';
    END IF;
  END IF;

  IF NEW.canceled_at IS NULL AND NEW.quantity > 0 THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended(NEW.activity_id::text || ':' || NEW.enrollment_id::text, 0)
    );

    SELECT COALESCE(SUM(quantity), 0)::integer
      INTO valid_total
    FROM signature_records
    WHERE activity_id = NEW.activity_id
      AND enrollment_id = NEW.enrollment_id
      AND canceled_at IS NULL
      AND id IS DISTINCT FROM NEW.id;

    IF valid_total + NEW.quantity > allowed_total THEN
      RAISE EXCEPTION 'El registro excede el máximo de firmas permitido';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER signature_records_validate_scope
BEFORE INSERT OR UPDATE ON signature_records
FOR EACH ROW EXECUTE FUNCTION validate_signature_scope();

CREATE OR REPLACE FUNCTION validate_exception_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  enrollment_course_id uuid;
  related_course_id uuid;
BEGIN
  SELECT course_id INTO enrollment_course_id
  FROM enrollments
  WHERE id = NEW.enrollment_id;

  IF enrollment_course_id IS DISTINCT FROM NEW.course_id THEN
    RAISE EXCEPTION 'La excepción y la inscripción deben pertenecer al mismo curso';
  END IF;

  IF NEW.class_session_id IS NOT NULL THEN
    SELECT course_id INTO related_course_id
    FROM class_sessions
    WHERE id = NEW.class_session_id;

    IF related_course_id IS DISTINCT FROM NEW.course_id THEN
      RAISE EXCEPTION 'La sesión relacionada pertenece a otro curso';
    END IF;
  END IF;

  IF NEW.activity_id IS NOT NULL THEN
    SELECT course_id INTO related_course_id
    FROM activities
    WHERE id = NEW.activity_id;

    IF related_course_id IS DISTINCT FROM NEW.course_id THEN
      RAISE EXCEPTION 'La actividad relacionada pertenece a otro curso';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER exception_requests_validate_scope
BEFORE INSERT OR UPDATE ON exception_requests
FOR EACH ROW EXECUTE FUNCTION validate_exception_scope();

COMMIT;
