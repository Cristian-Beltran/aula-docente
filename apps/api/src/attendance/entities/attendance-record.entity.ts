import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { ExceptionRequestEntity } from '../../exceptions/entities/exception-request.entity';

export enum RecordSource {
  QR = 'QR',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  OFFLINE_SYNC = 'OFFLINE_SYNC',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  JUSTIFIED = 'JUSTIFIED',
  EARLY_LEAVE = 'EARLY_LEAVE',
}

@Entity('attendance_records')
export class AttendanceRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'class_session_id' })
  classSessionId: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'enum', enum: AttendanceStatus, enumName: 'attendance_status', name: 'original_status' })
  originalStatus: AttendanceStatus;

  @Column({ type: 'enum', enum: AttendanceStatus, enumName: 'attendance_status', name: 'effective_status' })
  effectiveStatus: AttendanceStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'check_in_at' })
  checkInAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'check_out_at' })
  checkOutAt: Date;

  @Column({ type: 'enum', enum: RecordSource, enumName: 'record_source' })
  source: RecordSource;

  @Column({ type: 'uuid', name: 'registered_by' })
  registeredById: string;

  @Column({ type: 'uuid', nullable: true, name: 'exception_request_id' })
  exceptionRequestId: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'uuid', nullable: true, name: 'client_operation_id' })
  clientOperationId: string;

  @ManyToOne(() => ClassSessionEntity)
  @JoinColumn({ name: 'class_session_id' })
  classSession: ClassSessionEntity;

  @ManyToOne(() => EnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: EnrollmentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'registered_by' })
  registeredBy: UserEntity;

  @ManyToOne(() => ExceptionRequestEntity)
  @JoinColumn({ name: 'exception_request_id' })
  exceptionRequest: ExceptionRequestEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
