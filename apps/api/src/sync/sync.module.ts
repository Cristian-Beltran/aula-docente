import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncOperationEntity } from './entities/sync-operation.entity';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SyncOperationEntity])],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
