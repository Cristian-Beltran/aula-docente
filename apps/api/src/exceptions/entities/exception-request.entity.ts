import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { ActivityEntity } from '../../signatures/entities/activity.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { AttachmentEntity } from './attachment.entity';

export enum ExceptionType {
  ABSENCE_JUSTIFICATION = 'ABSENCE_JUSTIFICATION',
  OTHER_GROUP_ATTENDANCE = 'OTHER_GROUP_ATTENDANCE',
  RECOVERY = 'RECOVERY',
  LATE_REGISTRATION = 'LATE_REGISTRATION',
  ATTENDANCE_CORRECTION = 'ATTENDANCE_CORRECTION',
  MANUAL_SIGNATURE = 'MANUAL_SIGNATURE',
  OTHER = 'OTHER',
}

export enum ExceptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_INFORMATION = 'NEEDS_INFORMATION',
  CANCELED = 'CANCELED',
}

@Entity('exception_requests')
export class ExceptionRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_session_id' })
  classSessionId: string;

  @Column({ type: 'uuid', nullable: true, name: 'activity_id' })
  activityId: string;

  @Column({ type: 'enum', enum: ExceptionType, enumName: 'exception_type' })
  type: ExceptionType;

  @Column({ type: 'enum', enum: ExceptionStatus, enumName: 'exception_status', default: ExceptionStatus.PENDING })
  status: ExceptionStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedById: string;

  @Column({ type: 'timestamptz', name: 'requested_at' })
  requestedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'resolved_by' })
  resolvedById: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'resolution_note' })
  resolutionNote: string;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @ManyToOne(() => EnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: EnrollmentEntity;

  @ManyToOne(() => ClassSessionEntity)
  @JoinColumn({ name: 'class_session_id' })
  classSession: ClassSessionEntity;

  @ManyToOne(() => ActivityEntity)
  @JoinColumn({ name: 'activity_id' })
  activity: ActivityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'requested_by' })
  requestedBy: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'resolved_by' })
  resolvedBy: UserEntity;

  @OneToMany(() => AttachmentEntity, (attachment) => attachment.exceptionRequest)
  attachments: AttachmentEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
