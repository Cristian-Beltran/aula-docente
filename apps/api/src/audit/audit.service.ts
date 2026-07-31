import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { AuditLogEntity } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  log(entry: Partial<AuditLogEntity>) {
    const entity = this.repository.create(entry);
    return this.repository.save(entity);
  }

  async findByEntity(entityType: string, entityId: string, query: PaginationQueryDto) {
    const qb = this.repository
      .createQueryBuilder('audit')
      .where('audit.entity_type = :entityType', { entityType })
      .andWhere('audit.entity_id = :entityId', { entityId })
      .orderBy('audit.created_at', query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    return paginateQueryBuilder(qb, query);
  }
}
