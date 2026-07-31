import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { ClassGroupEntity } from '../../groups/entities/class-group.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { ExceptionRequestEntity } from '../../exceptions/entities/exception-request.entity';

export enum RecordSource {
  QR = 'QR',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  OFFLINE_SYNC = 'OFFLINE_SYNC',
}

@Entity('signature_records')
export class SignatureRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'activity_id' })
  activityId: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_session_id' })
  classSessionId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_group_id' })
  classGroupId: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'enum', enum: RecordSource, enumName: 'record_source' })
  source: RecordSource;

  @Column({ type: 'uuid', name: 'registered_by' })
  registeredById: string;

  @Column({ type: 'uuid', nullable: true, name: 'exception_request_id' })
  exceptionRequestId: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'timestamptz', name: 'registered_at' })
  registeredAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'canceled_at' })
  canceledAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'canceled_by' })
  canceledById: string;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @Column({ type: 'uuid', nullable: true, name: 'client_operation_id' })
  clientOperationId: string;

  @ManyToOne(() => ActivityEntity)
  @JoinColumn({ name: 'activity_id' })
  activity: ActivityEntity;

  @ManyToOne(() => EnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: EnrollmentEntity;

  @ManyToOne(() => ClassSessionEntity)
  @JoinColumn({ name: 'class_session_id' })
  classSession: ClassSessionEntity;

  @ManyToOne(() => ClassGroupEntity)
  @JoinColumn({ name: 'class_group_id' })
  classGroup: ClassGroupEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'registered_by' })
  registeredBy: UserEntity;

  @ManyToOne(() => ExceptionRequestEntity)
  @JoinColumn({ name: 'exception_request_id' })
  exceptionRequest: ExceptionRequestEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'canceled_by' })
  canceledBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
