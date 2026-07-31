import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../common/entities/user.entity';

export enum SyncStatus {
  RECEIVED = 'RECEIVED',
  APPLIED = 'APPLIED',
  CONFLICT = 'CONFLICT',
  REJECTED = 'REJECTED',
}

@Entity('sync_operations')
export class SyncOperationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'client_operation_id', unique: true })
  clientOperationId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 160, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'varchar', length: 100, name: 'operation_type' })
  operationType: string;

  @Column({ type: 'char', length: 64, name: 'payload_hash' })
  payloadHash: string;

  @Column({ type: 'enum', enum: SyncStatus, enumName: 'sync_status', default: SyncStatus.RECEIVED })
  status: SyncStatus;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'result_entity_type' })
  resultEntityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'result_entity_id' })
  resultEntityId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'error_code' })
  errorCode: string;

  @Column({ type: 'timestamptz', name: 'received_at' })
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
