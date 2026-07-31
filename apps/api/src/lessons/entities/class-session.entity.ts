import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { ClassGroupEntity } from '../../groups/entities/class-group.entity';
import { UserEntity } from '../../common/entities/user.entity';

export enum SessionStatus {
  PLANNED = 'PLANNED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

@Entity('class_sessions')
export class ClassSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'lesson_id' })
  lessonId: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_group_id' })
  classGroupId: string;

  @Column({ type: 'date', name: 'session_date' })
  sessionDate: Date;

  @Column({ type: 'timestamptz', name: 'starts_at' })
  startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'ends_at' })
  endsAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'opened_at' })
  openedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'closed_at' })
  closedAt: Date;

  @Column({ type: 'enum', enum: SessionStatus, enumName: 'session_status', default: SessionStatus.PLANNED })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true, name: 'topic_taught' })
  topicTaught: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'smallint', nullable: true, name: 'partial_override' })
  partialOverride: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.sessions)
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @ManyToOne(() => ClassGroupEntity)
  @JoinColumn({ name: 'class_group_id' })
  classGroup: ClassGroupEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
