import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriodEntity } from './entities/academic-period.entity';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriodsController } from './academic-periods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicPeriodEntity])],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [AcademicPeriodsService],
})
export class AcademicPeriodsModule {}
