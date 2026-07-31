import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { ClassSessionEntity } from './entities/class-session.entity';
import { LessonEntity } from './entities/lesson.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private readonly lessonRepository: Repository<LessonEntity>,
    @InjectRepository(ClassSessionEntity)
    private readonly sessionRepository: Repository<ClassSessionEntity>,
  ) {}

  async findByCourse(courseId: string, query: PaginationQueryDto) {
    const qb = this.lessonRepository.createQueryBuilder('lesson').where('lesson.course_id = :courseId', {
      courseId,
    });

    if (query.search) {
      qb.andWhere('lesson.title ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy(`lesson.${query.sortBy ?? 'createdAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    return paginateQueryBuilder(qb, query);
  }

  findOne(id: string) {
    return this.lessonRepository.findOne({ where: { id }, relations: ['sessions'] });
  }

  create(createDto: Partial<LessonEntity>) {
    const entity = this.lessonRepository.create(createDto);
    return this.lessonRepository.save(entity);
  }

  async update(id: string, updateDto: Partial<LessonEntity>) {
    await this.lessonRepository.update(id, updateDto);
    return this.lessonRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.lessonRepository.delete(id);
    return { id };
  }

  async getSessionsByLesson(lessonId: string, query: PaginationQueryDto) {
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.lesson_id = :lessonId', { lessonId });

    qb.orderBy(`session.${query.sortBy ?? 'startsAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    return paginateQueryBuilder(qb, query);
  }

  createSession(createDto: Partial<ClassSessionEntity>) {
    const entity = this.sessionRepository.create(createDto);
    return this.sessionRepository.save(entity);
  }
}
