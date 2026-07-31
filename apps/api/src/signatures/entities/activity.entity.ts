import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { LessonEntity } from '../../lessons/entities/lesson.entity';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { UserEntity } from '../../common/entities/user.entity';

export enum ActivityType {
  PRACTICE = 'PRACTICE',
  LAB = 'LAB',
  HOMEWORK = 'HOMEWORK',
  PARTICIPATION = 'PARTICIPATION',
  OTHER = 'OTHER',
}

export enum ActivityStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum ActivityGradingMode {
  SCORE_0_100 = 'SCORE_0_100',
  SIGNATURES = 'SIGNATURES',
}

@Entity('activities')
export class ActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'uuid', nullable: true, name: 'lesson_id' })
  lessonId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_session_id' })
  classSessionId: string | null;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'enum', enum: ActivityType, enumName: 'activity_type' })
  type: ActivityType;

  @Column({
    type: 'enum',
    enum: ActivityGradingMode,
    enumName: 'activity_grading_mode',
    name: 'grading_mode',
    default: ActivityGradingMode.SIGNATURES,
  })
  gradingMode: ActivityGradingMode;

  @Column({ type: 'date', nullable: true, name: 'activity_date' })
  activityDate: Date;

  @Column({ type: 'integer', name: 'max_signatures', default: 1 })
  maxSignatures: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'signature_value', default: 1 })
  signatureValue: number;

  @Column({ type: 'enum', enum: ActivityStatus, enumName: 'activity_status', default: ActivityStatus.DRAFT })
  status: ActivityStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @ManyToOne(() => LessonEntity)
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @ManyToOne(() => ClassSessionEntity)
  @JoinColumn({ name: 'class_session_id' })
  classSession: ClassSessionEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
