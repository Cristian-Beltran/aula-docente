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
import { UserEntity } from '../../common/entities/user.entity';
import { AcademicPeriodEntity } from '../../academic-periods/entities/academic-period.entity';
import { SubjectEntity } from '../../subjects/entities/subject.entity';
import { EnrollmentEntity } from './enrollment.entity';
import { ClassGroupEntity } from '../../groups/entities/class-group.entity';
import { LessonEntity } from '../../lessons/entities/lesson.entity';

export enum CourseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'subject_id' })
  subjectId: string;

  @Column({ type: 'uuid', name: 'academic_period_id' })
  academicPeriodId: string;

  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId: string;

  @Column({ type: 'varchar', length: 30 })
  parallel: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  modality: string;

  @Column({ type: 'jsonb', default: [] })
  schedule: any[];

  @Column({ type: 'integer', name: 'late_tolerance_minutes', default: 10 })
  lateToleranceMinutes: number;

  @Column({ type: 'enum', enum: CourseStatus, enumName: 'course_status', default: CourseStatus.DRAFT })
  status: CourseStatus;

  @Column({ type: 'date', nullable: true, name: 'partial_1_ends_at' })
  partial1EndsAt: string;

  @Column({ type: 'date', nullable: true, name: 'partial_2_ends_at' })
  partial2EndsAt: string;

  @ManyToOne(() => SubjectEntity)
  @JoinColumn({ name: 'subject_id' })
  subject: SubjectEntity;

  @ManyToOne(() => AcademicPeriodEntity)
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriodEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'teacher_id' })
  teacher: UserEntity;

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.course)
  enrollments: EnrollmentEntity[];

  @OneToMany(() => ClassGroupEntity, (group) => group.course)
  groups: ClassGroupEntity[];

  @OneToMany(() => LessonEntity, (lesson) => lesson.course)
  lessons: LessonEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
