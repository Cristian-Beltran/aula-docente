import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { CourseEntity } from './entities/course.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
  ) {}

  async findAll(query: PaginationQueryDto, teacherId?: string, isAdmin = false) {
    const qb = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.academicPeriod', 'academicPeriod')
      .leftJoinAndSelect('course.teacher', 'teacher');

    if (!isAdmin && teacherId) {
      qb.andWhere('course.teacher_id = :teacherId', { teacherId });
    }

    if (query.search) {
      qb.andWhere(
        `(
          course.parallel ILIKE :search
          OR COALESCE(course.modality, '') ILIKE :search
          OR subject.name ILIKE :search
          OR subject.code ILIKE :search
          OR teacher.full_name ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(`course.${query.sortBy ?? 'createdAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    return paginateQueryBuilder(qb, query);
  }

  findOne(id: string) {
    return this.courseRepository.findOne({
      where: { id },
      relations: ['subject', 'academicPeriod', 'teacher', 'enrollments', 'groups'],
    });
  }

  create(createDto: Partial<CourseEntity>) {
    const entity = this.courseRepository.create(createDto);
    return this.courseRepository.save(entity);
  }

  async update(id: string, updateDto: Partial<CourseEntity>) {
    await this.courseRepository.update(id, updateDto);
    return this.courseRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.courseRepository.delete(id);
    return { id };
  }

  async getEnrollments(courseId: string, query: PaginationQueryDto) {
    const qb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('enrollment.course_id = :courseId', { courseId });

    if (query.search) {
      qb.andWhere(
        `(
          student.student_code ILIKE :search
          OR student.first_name ILIKE :search
          OR student.last_name ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(`enrollment.${query.sortBy ?? 'createdAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    return paginateQueryBuilder(qb, query);
  }
}
