BEGIN;

-- Este archivo contiene datos de desarrollo. No debe ejecutarse en producción.

INSERT INTO users (id, full_name, email, password_hash, role)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'Docente de demostración',
  'docente@example.edu',
  '$argon2id$DEVELOPMENT_HASH_REPLACE_ME',
  'TEACHER'
);

INSERT INTO academic_periods (
  id, name, start_date, end_date, status, created_by
)
VALUES (
  '20000000-0000-4000-8000-000000000001',
  '2026 - Segundo semestre',
  '2026-08-03',
  '2026-12-18',
  'ACTIVE',
  '10000000-0000-4000-8000-000000000001'
);

INSERT INTO subjects (id, code, name, description, created_by)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  'ELC-101',
  'Electrónica I',
  'Materia de demostración para prácticas y laboratorios.',
  '10000000-0000-4000-8000-000000000001'
);

INSERT INTO courses (
  id, subject_id, academic_period_id, teacher_id, parallel, modality,
  schedule, status
)
VALUES (
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'A',
  'PRESENCIAL',
  '[{"day":"MONDAY","startsAt":"08:00","endsAt":"10:00"}]'::jsonb,
  'ACTIVE'
);

INSERT INTO class_groups (id, course_id, name, code, type)
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Laboratorio 1',
    'LAB-1',
    'LAB'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    'Laboratorio 2',
    'LAB-2',
    'LAB'
  );

COMMIT;

