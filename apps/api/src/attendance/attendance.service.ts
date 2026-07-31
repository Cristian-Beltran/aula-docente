import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { AttendanceRecordEntity } from './entities/attendance-record.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecordEntity)
    private readonly repository: Repository<AttendanceRecordEntity>,
  ) {}

  async findBySession(sessionId: string, query: PaginationQueryDto) {
    const qb = this.repository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('attendance.class_session_id = :sessionId', { sessionId });

    if (query.search) {
      qb.andWhere(
        '(student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(
      `attendance.${query.sortBy ?? 'createdAt'}`,
      query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );

    return paginateQueryBuilder(qb, query);
  }

  create(createDto: Partial<AttendanceRecordEntity>) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: Partial<AttendanceRecordEntity>) {
    await this.repository.update(id, updateDto);
    return this.repository.findOne({ where: { id } });
  }
}
