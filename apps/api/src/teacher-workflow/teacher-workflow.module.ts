import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriodEntity } from '../academic-periods/entities/academic-period.entity';
import { AttendanceRecordEntity } from '../attendance/entities/attendance-record.entity';
import { UserEntity } from '../common/entities/user.entity';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentEntity } from '../courses/entities/enrollment.entity';
import { AttachmentEntity } from '../exceptions/entities/attachment.entity';
import { ExceptionRequestEntity } from '../exceptions/entities/exception-request.entity';
import { ClassGroupEntity } from '../groups/entities/class-group.entity';
import { GroupMembershipEntity } from '../groups/entities/group-membership.entity';
import { LessonEntity } from '../lessons/entities/lesson.entity';
import { ClassSessionEntity } from '../lessons/entities/class-session.entity';
import { ActivityEntity } from '../signatures/entities/activity.entity';
import { QrCredentialEntity } from '../signatures/entities/qr-credential.entity';
import { ScoreRecordEntity } from '../signatures/entities/score-record.entity';
import { SignatureRecordEntity } from '../signatures/entities/signature-record.entity';
import { StudentEntity } from '../students/entities/student.entity';
import { SubjectEntity } from '../subjects/entities/subject.entity';
import { CourseSpreadsheetEntity } from '../modules/google-sheets/entities/course-spreadsheet.entity';
import { SheetSyncJobEntity } from '../modules/google-sheets/entities/sheet-sync-job.entity';
import { GoogleSheetsModule } from '../modules/google-sheets/google-sheets.module';
import { TeacherWorkflowController } from './teacher-workflow.controller';
import { TeacherWorkflowService } from './teacher-workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicPeriodEntity,
      AttendanceRecordEntity,
      CourseEntity,
      EnrollmentEntity,
      ExceptionRequestEntity,
      AttachmentEntity,
      ClassGroupEntity,
      GroupMembershipEntity,
      LessonEntity,
      ClassSessionEntity,
      ActivityEntity,
      QrCredentialEntity,
      ScoreRecordEntity,
      SignatureRecordEntity,
      StudentEntity,
      SubjectEntity,
      UserEntity,
      CourseSpreadsheetEntity,
      SheetSyncJobEntity,
    ]),
    GoogleSheetsModule,
  ],
  controllers: [TeacherWorkflowController],
  providers: [TeacherWorkflowService],
  exports: [TeacherWorkflowService],
})
export class TeacherWorkflowModule {}
