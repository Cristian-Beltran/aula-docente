import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1722200000000 implements MigrationInterface {
  name = 'InitialSchema1722200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'ASSISTANT');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_status') THEN
          CREATE TYPE period_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
          CREATE TYPE course_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
          CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'WITHDRAWN', 'PASSED', 'FAILED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_type') THEN
          CREATE TYPE group_type AS ENUM ('LAB', 'PRACTICE', 'PROJECT', 'CUSTOM');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_type') THEN
          CREATE TYPE lesson_type AS ENUM ('LECTURE', 'LAB', 'PRACTICE', 'EXAM', 'OTHER');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
          CREATE TYPE session_status AS ENUM ('PLANNED', 'OPEN', 'CLOSED', 'CANCELED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
          CREATE TYPE activity_type AS ENUM ('PRACTICE', 'LAB', 'HOMEWORK', 'PARTICIPATION', 'OTHER');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_status') THEN
          CREATE TYPE activity_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_source') THEN
          CREATE TYPE record_source AS ENUM ('QR', 'MANUAL', 'IMPORT', 'OFFLINE_SYNC');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
          CREATE TYPE attendance_status AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'JUSTIFIED', 'EARLY_LEAVE');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exception_type') THEN
          CREATE TYPE exception_type AS ENUM (
            'ABSENCE_JUSTIFICATION',
            'OTHER_GROUP_ATTENDANCE',
            'RECOVERY',
            'LATE_REGISTRATION',
            'ATTENDANCE_CORRECTION',
            'MANUAL_SIGNATURE',
            'OTHER'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exception_status') THEN
          CREATE TYPE exception_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFORMATION', 'CANCELED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
          CREATE TYPE sync_status AS ENUM ('RECEIVED', 'APPLIED', 'CONFLICT', 'REJECTED');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name varchar(160) NOT NULL,
        email varchar(254) NOT NULL,
        password_hash text NOT NULL,
        role user_role NOT NULL DEFAULT 'TEACHER',
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT users_email_normalized_uk UNIQUE (email),
        CONSTRAINT users_email_lower_ck CHECK (email = lower(email))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash text NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        remember_me boolean NOT NULL DEFAULT false,
        user_agent varchar(500),
        ip_address inet,
        last_used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS user_sessions_user_active_idx
        ON user_sessions (user_id, created_at DESC)
        WHERE revoked_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS academic_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        status period_status NOT NULL DEFAULT 'DRAFT',
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT academic_period_dates_ck CHECK (end_date >= start_date),
        CONSTRAINT academic_period_name_uk UNIQUE (name)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(40) NOT NULL,
        name varchar(160) NOT NULL,
        description text,
        active boolean NOT NULL DEFAULT true,
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT subjects_code_uk UNIQUE (code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id uuid NOT NULL REFERENCES subjects(id),
        academic_period_id uuid NOT NULL REFERENCES academic_periods(id),
        teacher_id uuid NOT NULL REFERENCES users(id),
        parallel varchar(30) NOT NULL,
        modality varchar(40),
        schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
        late_tolerance_minutes integer NOT NULL DEFAULT 10,
        status course_status NOT NULL DEFAULT 'DRAFT',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT courses_tolerance_ck CHECK (late_tolerance_minutes BETWEEN 0 AND 180),
        CONSTRAINT courses_offering_uk UNIQUE (subject_id, academic_period_id, parallel)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_staff (
        course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id),
        can_take_attendance boolean NOT NULL DEFAULT true,
        can_register_signatures boolean NOT NULL DEFAULT true,
        can_resolve_exceptions boolean NOT NULL DEFAULT false,
        assigned_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (course_id, user_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS students (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        student_code varchar(60) NOT NULL,
        first_name varchar(100) NOT NULL,
        last_name varchar(120) NOT NULL,
        identity_number varchar(40),
        email varchar(254),
        phone varchar(40),
        photo_url text,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT students_code_uk UNIQUE (student_code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id),
        student_id uuid NOT NULL REFERENCES students(id),
        status enrollment_status NOT NULL DEFAULT 'ACTIVE',
        enrolled_at timestamptz NOT NULL DEFAULT now(),
        withdrawn_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT enrollments_course_student_uk UNIQUE (course_id, student_id),
        CONSTRAINT enrollments_withdrawal_ck CHECK (
          (status = 'WITHDRAWN' AND withdrawn_at IS NOT NULL)
          OR (status <> 'WITHDRAWN')
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS class_groups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        name varchar(100) NOT NULL,
        code varchar(40) NOT NULL,
        type group_type NOT NULL,
        schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT class_groups_code_uk UNIQUE (course_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_memberships (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        class_group_id uuid NOT NULL REFERENCES class_groups(id),
        enrollment_id uuid NOT NULL REFERENCES enrollments(id),
        assigned_at timestamptz NOT NULL DEFAULT now(),
        removed_at timestamptz,
        assigned_by uuid NOT NULL REFERENCES users(id),
        removal_reason text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT group_membership_dates_ck CHECK (removed_at IS NULL OR removed_at >= assigned_at),
        CONSTRAINT group_membership_version_uk UNIQUE (class_group_id, enrollment_id, assigned_at)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS group_memberships_active_uk
        ON group_memberships (class_group_id, enrollment_id)
        WHERE removed_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id),
        title varchar(180) NOT NULL,
        type lesson_type NOT NULL,
        planned_topic text,
        sequence_number integer,
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT lessons_sequence_ck CHECK (sequence_number IS NULL OR sequence_number > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS class_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id uuid NOT NULL REFERENCES lessons(id),
        course_id uuid NOT NULL REFERENCES courses(id),
        class_group_id uuid REFERENCES class_groups(id),
        session_date date NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz,
        opened_at timestamptz,
        closed_at timestamptz,
        status session_status NOT NULL DEFAULT 'PLANNED',
        topic_taught text,
        notes text,
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT class_sessions_time_ck CHECK (ends_at IS NULL OR ends_at > starts_at),
        CONSTRAINT class_sessions_close_ck CHECK (closed_at IS NULL OR opened_at IS NOT NULL)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id),
        lesson_id uuid REFERENCES lessons(id),
        title varchar(180) NOT NULL,
        type activity_type NOT NULL,
        activity_date date,
        max_signatures integer NOT NULL DEFAULT 1,
        signature_value numeric(8,2) NOT NULL DEFAULT 1,
        status activity_status NOT NULL DEFAULT 'DRAFT',
        notes text,
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT activities_max_ck CHECK (max_signatures > 0),
        CONSTRAINT activities_value_ck CHECK (signature_value >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS exception_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id uuid NOT NULL REFERENCES courses(id),
        enrollment_id uuid NOT NULL REFERENCES enrollments(id),
        class_session_id uuid REFERENCES class_sessions(id),
        activity_id uuid REFERENCES activities(id),
        type exception_type NOT NULL,
        status exception_status NOT NULL DEFAULT 'PENDING',
        reason text NOT NULL,
        requested_by uuid NOT NULL REFERENCES users(id),
        requested_at timestamptz NOT NULL DEFAULT now(),
        resolved_by uuid REFERENCES users(id),
        resolved_at timestamptz,
        resolution_note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT exception_resolution_ck CHECK (
          (status IN ('APPROVED', 'REJECTED') AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
          OR status NOT IN ('APPROVED', 'REJECTED')
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        class_session_id uuid NOT NULL REFERENCES class_sessions(id),
        enrollment_id uuid NOT NULL REFERENCES enrollments(id),
        original_status attendance_status NOT NULL,
        effective_status attendance_status NOT NULL,
        check_in_at timestamptz,
        check_out_at timestamptz,
        source record_source NOT NULL,
        registered_by uuid NOT NULL REFERENCES users(id),
        exception_request_id uuid REFERENCES exception_requests(id),
        comment text,
        client_operation_id uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT attendance_session_enrollment_uk UNIQUE (class_session_id, enrollment_id),
        CONSTRAINT attendance_check_times_ck CHECK (
          check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS attendance_client_operation_uk
        ON attendance_records (client_operation_id)
        WHERE client_operation_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS signature_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id uuid NOT NULL REFERENCES activities(id),
        enrollment_id uuid NOT NULL REFERENCES enrollments(id),
        class_session_id uuid REFERENCES class_sessions(id),
        class_group_id uuid REFERENCES class_groups(id),
        quantity integer NOT NULL DEFAULT 1,
        source record_source NOT NULL,
        registered_by uuid NOT NULL REFERENCES users(id),
        exception_request_id uuid REFERENCES exception_requests(id),
        comment text,
        registered_at timestamptz NOT NULL DEFAULT now(),
        canceled_at timestamptz,
        canceled_by uuid REFERENCES users(id),
        cancellation_reason text,
        client_operation_id uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT signature_quantity_ck CHECK (quantity <> 0),
        CONSTRAINT signature_cancellation_ck CHECK (
          (canceled_at IS NULL AND canceled_by IS NULL AND cancellation_reason IS NULL)
          OR (canceled_at IS NOT NULL AND canceled_by IS NOT NULL AND cancellation_reason IS NOT NULL)
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS signature_client_operation_uk
        ON signature_records (client_operation_id)
        WHERE client_operation_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS qr_credentials (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enrollment_id uuid NOT NULL REFERENCES enrollments(id),
        token_hash text NOT NULL,
        version integer NOT NULL DEFAULT 1,
        expires_at timestamptz,
        revoked_at timestamptz,
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT qr_credentials_token_hash_uk UNIQUE (token_hash),
        CONSTRAINT qr_credentials_version_uk UNIQUE (enrollment_id, version),
        CONSTRAINT qr_credentials_version_ck CHECK (version > 0)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS qr_credentials_active_uk
        ON qr_credentials (enrollment_id)
        WHERE revoked_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        exception_request_id uuid NOT NULL REFERENCES exception_requests(id) ON DELETE CASCADE,
        storage_key text NOT NULL,
        original_name varchar(255) NOT NULL,
        mime_type varchar(120) NOT NULL,
        size_bytes bigint NOT NULL,
        checksum_sha256 char(64),
        uploaded_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT attachments_size_ck CHECK (size_bytes > 0),
        CONSTRAINT attachments_storage_key_uk UNIQUE (storage_key)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sync_operations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        client_operation_id uuid NOT NULL,
        user_id uuid NOT NULL REFERENCES users(id),
        device_id varchar(160) NOT NULL,
        operation_type varchar(100) NOT NULL,
        payload_hash char(64) NOT NULL,
        status sync_status NOT NULL DEFAULT 'RECEIVED',
        result_entity_type varchar(100),
        result_entity_id uuid,
        error_code varchar(100),
        received_at timestamptz NOT NULL DEFAULT now(),
        processed_at timestamptz,
        CONSTRAINT sync_operations_client_uk UNIQUE (client_operation_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id bigserial PRIMARY KEY,
        user_id uuid REFERENCES users(id),
        entity_type varchar(100) NOT NULL,
        entity_id uuid NOT NULL,
        action varchar(100) NOT NULL,
        previous_data jsonb,
        new_data jsonb,
        request_id uuid,
        device_id varchar(160),
        ip_address inet,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS students_name_idx ON students (last_name, first_name)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS enrollments_course_status_idx ON enrollments (course_id, status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS group_memberships_group_active_idx ON group_memberships (class_group_id, removed_at)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS lessons_course_idx ON lessons (course_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS class_sessions_course_date_idx ON class_sessions (course_id, session_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS class_sessions_group_date_idx ON class_sessions (class_group_id, session_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS activities_course_status_idx ON activities (course_id, status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS attendance_enrollment_idx ON attendance_records (enrollment_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS signatures_activity_enrollment_idx ON signature_records (activity_id, enrollment_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS signatures_session_idx ON signature_records (class_session_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS exceptions_course_status_idx ON exception_requests (course_id, status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS audit_entity_date_idx ON audit_logs (entity_type, entity_id, created_at DESC)`);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_signature_totals AS
      SELECT
        activity_id,
        enrollment_id,
        COALESCE(SUM(quantity), 0)::integer AS total_signatures
      FROM signature_records
      WHERE canceled_at IS NULL
      GROUP BY activity_id, enrollment_id
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_attendance_effective AS
      SELECT
        ar.id,
        ar.class_session_id,
        ar.enrollment_id,
        ar.original_status,
        ar.effective_status,
        ar.check_in_at,
        ar.check_out_at,
        ar.source,
        ar.exception_request_id
      FROM attendance_records ar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS v_attendance_effective`);
    await queryRunner.query(`DROP VIEW IF EXISTS v_signature_totals`);
    await queryRunner.query(`DROP TABLE IF EXISTS sync_operations`);
    await queryRunner.query(`DROP TABLE IF EXISTS attachments`);
    await queryRunner.query(`DROP TABLE IF EXISTS qr_credentials`);
    await queryRunner.query(`DROP TABLE IF EXISTS signature_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS attendance_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS exception_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS activities`);
    await queryRunner.query(`DROP TABLE IF EXISTS class_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS lessons`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_memberships`);
    await queryRunner.query(`DROP TABLE IF EXISTS class_groups`);
    await queryRunner.query(`DROP TABLE IF EXISTS enrollments`);
    await queryRunner.query(`DROP TABLE IF EXISTS students`);
    await queryRunner.query(`DROP TABLE IF EXISTS course_staff`);
    await queryRunner.query(`DROP TABLE IF EXISTS courses`);
    await queryRunner.query(`DROP TABLE IF EXISTS subjects`);
    await queryRunner.query(`DROP TABLE IF EXISTS academic_periods`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
