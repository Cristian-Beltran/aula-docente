import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityEntity } from './activity.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { UserEntity } from '../../common/entities/user.entity';

@Entity('score_records')
export class ScoreRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'activity_id' })
  activityId: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_session_id' })
  classSessionId: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'uuid', name: 'registered_by' })
  registeredById: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @ManyToOne(() => ActivityEntity)
  @JoinColumn({ name: 'activity_id' })
  activity: ActivityEntity;

  @ManyToOne(() => EnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: EnrollmentEntity;

  @ManyToOne(() => ClassSessionEntity)
  @JoinColumn({ name: 'class_session_id' })
  classSession: ClassSessionEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'registered_by' })
  registeredBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
