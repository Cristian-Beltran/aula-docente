import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { ActivityEntity } from './entities/activity.entity';
import { QrCredentialEntity } from './entities/qr-credential.entity';
import { SignatureRecordEntity } from './entities/signature-record.entity';

@Injectable()
export class SignaturesService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
    @InjectRepository(SignatureRecordEntity)
    private readonly signatureRepository: Repository<SignatureRecordEntity>,
    @InjectRepository(QrCredentialEntity)
    private readonly qrRepository: Repository<QrCredentialEntity>,
  ) {}

  async findByCourse(courseId: string, query: PaginationQueryDto) {
    const qb = this.activityRepository.createQueryBuilder('activity').where('activity.course_id = :courseId', {
      courseId,
    });

    if (query.search) {
      qb.andWhere('activity.title ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy(
      `activity.${query.sortBy ?? 'createdAt'}`,
      query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );

    return paginateQueryBuilder(qb, query);
  }

  createSignature(createDto: Partial<SignatureRecordEntity>) {
    const entity = this.signatureRepository.create({
      registeredAt: new Date(),
      ...createDto,
    });
    return this.signatureRepository.save(entity);
  }

  validateQr(token: string) {
    return this.qrRepository.findOne({ where: { tokenHash: token } });
  }
}
