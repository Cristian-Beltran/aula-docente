import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1785357811823 implements MigrationInterface {
    name = 'Auto1785357811823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_class_session"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_score_records_registered_by"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_score_records_session"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_score_records_enrollment"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_score_records_activity"`);
        await queryRunner.query(`DROP INDEX "public"."activities_session_status_idx"`);
        await queryRunner.query(`DROP INDEX "public"."score_records_activity_enrollment_uk"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "CK_score_records_score"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_4ea111d4bedad24f545d45c99f1" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_7ea7a0d0beda4c30334ab757234" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_2336887e0ee83d449497407c956" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_7fd45ee5e78625b4597407db9b5" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_97bd9b64dc56d89a652d22f5d33" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_97bd9b64dc56d89a652d22f5d33"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_7fd45ee5e78625b4597407db9b5"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_2336887e0ee83d449497407c956"`);
        await queryRunner.query(`ALTER TABLE "score_records" DROP CONSTRAINT "FK_7ea7a0d0beda4c30334ab757234"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_4ea111d4bedad24f545d45c99f1"`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "CK_score_records_score" CHECK (((score >= (0)::numeric) AND (score <= (100)::numeric)))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "score_records_activity_enrollment_uk" ON "score_records" ("activity_id", "enrollment_id") `);
        await queryRunner.query(`CREATE INDEX "activities_session_status_idx" ON "activities" ("status", "class_session_id") `);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_score_records_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_score_records_enrollment" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_score_records_session" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score_records" ADD CONSTRAINT "FK_score_records_registered_by" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_class_session" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
