import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';
import { GoogleIntegrationSettingEntity } from './entities/google-integration-setting.entity';
import { CourseSpreadsheetEntity } from './entities/course-spreadsheet.entity';
import { SheetSyncJobEntity } from './entities/sheet-sync-job.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { ActivityEntity } from '../../signatures/entities/activity.entity';
import { SignatureRecordEntity } from '../../signatures/entities/signature-record.entity';
import { ScoreRecordEntity } from '../../signatures/entities/score-record.entity';
import { AttendanceRecordEntity } from '../../attendance/entities/attendance-record.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { GoogleAuthService } from './services/google-auth.service';
import { SpreadsheetCreatorService } from './services/spreadsheet-creator.service';
import { CourseSheetSyncService } from './services/course-sheet-sync.service';
import { GoogleIntegrationController } from './controllers/google-integration.controller';
import { CourseSpreadsheetController } from './controllers/course-spreadsheet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoogleIntegrationSettingEntity,
      CourseSpreadsheetEntity,
      SheetSyncJobEntity,
      EnrollmentEntity,
      ClassSessionEntity,
      ActivityEntity,
      SignatureRecordEntity,
      ScoreRecordEntity,
      AttendanceRecordEntity,
      CourseEntity,
    ]),
    ConfigModule,
    AuthModule,
  ],
  controllers: [GoogleIntegrationController, CourseSpreadsheetController],
  providers: [GoogleAuthService, SpreadsheetCreatorService, CourseSheetSyncService],
  exports: [CourseSheetSyncService, GoogleAuthService],
})
export class GoogleSheetsModule {}
