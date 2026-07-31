import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './entities/course.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, EnrollmentEntity])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
