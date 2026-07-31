import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { AttachmentEntity } from './entities/attachment.entity';
import { ExceptionRequestEntity } from './entities/exception-request.entity';

@Injectable()
export class ExceptionsService {
  constructor(
    @InjectRepository(ExceptionRequestEntity)
    private readonly repository: Repository<ExceptionRequestEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  async findByCourse(courseId: string, query: PaginationQueryDto & { status?: string }) {
    const qb = this.repository
      .createQueryBuilder('exception')
      .where('exception.course_id = :courseId', { courseId });

    if (query.status) {
      qb.andWhere('exception.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('exception.reason ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy(
      `exception.${query.sortBy ?? 'requestedAt'}`,
      query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );
    return paginateQueryBuilder(qb, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ where: { id }, relations: ['attachments'] });
  }

  create(createDto: Partial<ExceptionRequestEntity>) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async resolve(id: string, resolveDto: { status: string; resolutionNote: string; resolvedById: string }) {
    await this.repository.update(id, {
      status: resolveDto.status as any,
      resolutionNote: resolveDto.resolutionNote,
      resolvedById: resolveDto.resolvedById,
      resolvedAt: new Date(),
    });
    return this.repository.findOne({ where: { id } });
  }

  addAttachment(createDto: Partial<AttachmentEntity>) {
    const entity = this.attachmentRepository.create(createDto);
    return this.attachmentRepository.save(entity);
  }
}
