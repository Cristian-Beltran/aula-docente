import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeacherWorkflow1785372000000 implements MigrationInterface {
  name = 'TeacherWorkflow1785372000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_grading_mode') THEN
          CREATE TYPE "activity_grading_mode" AS ENUM ('SCORE_0_100', 'SIGNATURES');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD COLUMN IF NOT EXISTS "full_name" varchar(180)
    `);

    await queryRunner.query(`
      UPDATE "students"
      SET "full_name" = trim(concat_ws(' ', "first_name", "last_name"))
      WHERE "full_name" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "activities"
      ADD COLUMN IF NOT EXISTS "class_session_id" uuid,
      ADD COLUMN IF NOT EXISTS "grading_mode" "activity_grading_mode" NOT NULL DEFAULT 'SIGNATURES'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_activities_class_session'
            AND table_name = 'activities'
        ) THEN
          ALTER TABLE "activities"
          ADD CONSTRAINT "FK_activities_class_session"
          FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "score_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "activity_id" uuid NOT NULL,
        "enrollment_id" uuid NOT NULL,
        "class_session_id" uuid,
        "score" numeric(5,2) NOT NULL,
        "registered_by" uuid NOT NULL,
        "comment" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_score_records" PRIMARY KEY ("id"),
        CONSTRAINT "CK_score_records_score" CHECK ("score" >= 0 AND "score" <= 100),
        CONSTRAINT "FK_score_records_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_score_records_enrollment" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_score_records_session" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_score_records_registered_by" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "score_records_activity_enrollment_uk"
      ON "score_records" ("activity_id", "enrollment_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "activities_session_status_idx"
      ON "activities" ("class_session_id", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "activities_session_status_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "score_records_activity_enrollment_uk"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "score_records"`);
    await queryRunner.query(`
      ALTER TABLE "students"
      DROP COLUMN IF EXISTS "full_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "activities"
      DROP CONSTRAINT IF EXISTS "FK_activities_class_session"
    `);
    await queryRunner.query(`
      ALTER TABLE "activities"
      DROP COLUMN IF EXISTS "grading_mode",
      DROP COLUMN IF EXISTS "class_session_id"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_grading_mode"`);
  }
}
