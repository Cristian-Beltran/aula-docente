import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { StudentEntity } from './entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const qb = this.repository.createQueryBuilder('student');

    if (query.search) {
      qb.where(
        `(
          student.student_code ILIKE :search
          OR student.first_name ILIKE :search
          OR student.last_name ILIKE :search
          OR COALESCE(student.identity_number, '') ILIKE :search
          OR COALESCE(student.email, '') ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(`student.${query.sortBy ?? 'createdAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    return paginateQueryBuilder(qb, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  create(createDto: Partial<StudentEntity>) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: Partial<StudentEntity>) {
    await this.repository.update(id, updateDto);
    return this.repository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { id };
  }
}
