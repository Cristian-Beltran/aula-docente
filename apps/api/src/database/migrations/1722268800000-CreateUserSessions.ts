import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSessions1722268800000 implements MigrationInterface {
  name = 'CreateUserSessions1722268800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS user_sessions_user_active_idx`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`);
  }
}
