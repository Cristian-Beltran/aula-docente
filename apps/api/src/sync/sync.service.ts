import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncOperationEntity } from './entities/sync-operation.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncOperationEntity)
    private readonly repository: Repository<SyncOperationEntity>,
  ) {}

  async receiveBatch(operations: Partial<SyncOperationEntity>[]) {
    const results: Array<SyncOperationEntity | (Partial<SyncOperationEntity> & { syncResult: string })> = [];
    for (const op of operations) {
      const existing = await this.repository.findOne({
        where: { clientOperationId: op.clientOperationId },
      });
      if (existing) {
        results.push({ ...existing, syncResult: 'DUPLICATE' });
      } else {
        const created = this.repository.create(op);
        const saved = await this.repository.save(created);
        results.push(saved);
      }
    }
    return results;
  }

  findByDevice(deviceId: string) {
    return this.repository.find({ where: { deviceId } });
  }
}
