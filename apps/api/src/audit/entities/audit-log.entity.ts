import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../common/entities/user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'jsonb', nullable: true, name: 'previous_data' })
  previousData: any;

  @Column({ type: 'jsonb', nullable: true, name: 'new_data' })
  newData: any;

  @Column({ type: 'uuid', nullable: true, name: 'request_id' })
  requestId: string;

  @Column({ type: 'varchar', length: 160, nullable: true, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
