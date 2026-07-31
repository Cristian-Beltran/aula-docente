import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { AuthModule } from './auth/auth.module';
import { AcademicPeriodsModule } from './academic-periods/academic-periods.module';
import { SubjectsModule } from './subjects/subjects.module';
import { CoursesModule } from './courses/courses.module';
import { StudentsModule } from './students/students.module';
import { GroupsModule } from './groups/groups.module';
import { LessonsModule } from './lessons/lessons.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SignaturesModule } from './signatures/signatures.module';
import { ExceptionsModule } from './exceptions/exceptions.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { SyncModule } from './sync/sync.module';
import { TeacherWorkflowModule } from './teacher-workflow/teacher-workflow.module';
import { GoogleSheetsModule } from './modules/google-sheets/google-sheets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '.env.example'),
        resolve(process.cwd(), '../../.env'),
        resolve(process.cwd(), '../../.env.example'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'aula_user'),
        password: configService.get<string>('DATABASE_PASSWORD', 'aula_secret'),
        database: configService.get<string>('DATABASE_NAME', 'aula_docente'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule,
    AcademicPeriodsModule,
    SubjectsModule,
    CoursesModule,
    StudentsModule,
    GroupsModule,
    LessonsModule,
    AttendanceModule,
    SignaturesModule,
    ExceptionsModule,
    ReportsModule,
    AuditModule,
    SyncModule,
    TeacherWorkflowModule,
    GoogleSheetsModule,
  ],
})
export class AppModule {}
