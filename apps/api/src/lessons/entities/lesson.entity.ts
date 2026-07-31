import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { ClassSessionEntity } from './class-session.entity';

export enum LessonType {
  LECTURE = 'LECTURE',
  LAB = 'LAB',
  PRACTICE = 'PRACTICE',
  EXAM = 'EXAM',
  OTHER = 'OTHER',
}

@Entity('lessons')
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'enum', enum: LessonType, enumName: 'lesson_type' })
  type: LessonType;

  @Column({ type: 'text', nullable: true, name: 'planned_topic' })
  plannedTopic: string;

  @Column({ type: 'integer', nullable: true, name: 'sequence_number' })
  sequenceNumber: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @ManyToOne(() => CourseEntity, (course) => course.lessons)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @OneToMany(() => ClassSessionEntity, (session) => session.lesson)
  sessions: ClassSessionEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
