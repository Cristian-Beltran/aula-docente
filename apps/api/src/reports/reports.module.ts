import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecordEntity } from '../attendance/entities/attendance-record.entity';
import { EnrollmentEntity } from '../courses/entities/enrollment.entity';
import { ExceptionRequestEntity } from '../exceptions/entities/exception-request.entity';
import { ClassGroupEntity } from '../groups/entities/class-group.entity';
import { ClassSessionEntity } from '../lessons/entities/class-session.entity';
import { SignatureRecordEntity } from '../signatures/entities/signature-record.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnrollmentEntity,
      ClassGroupEntity,
      ClassSessionEntity,
      AttendanceRecordEntity,
      SignatureRecordEntity,
      ExceptionRequestEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
