BEGIN;

CREATE TABLE google_integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id),
  project_id varchar(200) NOT NULL,
  service_account_email varchar(254) NOT NULL,
  encrypted_private_key text NOT NULL,
  share_with_email varchar(254),
  status varchar(40) NOT NULL DEFAULT 'ACTIVE',
  last_validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX google_integration_settings_owner_uk
  ON google_integration_settings (owner_user_id)
  WHERE status = 'ACTIVE';

CREATE TABLE course_spreadsheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  google_integration_setting_id uuid REFERENCES google_integration_settings(id),
  spreadsheet_id varchar(120),
  spreadsheet_url text,
  spreadsheet_name varchar(300),
  template_version integer NOT NULL DEFAULT 1,
  status varchar(40) NOT NULL DEFAULT 'NOT_CONFIGURED',
  last_synced_at timestamptz,
  last_synced_class_id uuid,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_spreadsheets_course_uk UNIQUE (course_id),
  CONSTRAINT course_spreadsheets_spreadsheet_uk UNIQUE (spreadsheet_id)
);

CREATE TABLE sheet_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  class_id uuid,
  reason varchar(40) NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  status varchar(40) NOT NULL DEFAULT 'PENDING',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT sheet_sync_jobs_duplicate_uk
    UNIQUE (course_id, class_id, revision, reason)
);

CREATE INDEX sheet_sync_jobs_pending_idx ON sheet_sync_jobs (status, created_at)
  WHERE status IN ('PENDING', 'FAILED');

COMMIT;
