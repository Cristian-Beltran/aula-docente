import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseEntity } from '../../../courses/entities/course.entity';

@Entity('sheet_sync_jobs')
export class SheetSyncJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'uuid', nullable: true, name: 'class_id' })
  classId: string;

  @Column({ type: 'varchar', length: 40 })
  reason: string;

  @Column({ type: 'integer', default: 1 })
  revision: number;

  @Column({ type: 'varchar', length: 40, default: 'PENDING' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
