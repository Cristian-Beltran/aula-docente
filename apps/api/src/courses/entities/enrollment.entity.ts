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
import { StudentEntity } from '../../students/entities/student.entity';

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  WITHDRAWN = 'WITHDRAWN',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

@Entity('enrollments')
export class EnrollmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @Column({ type: 'enum', enum: EnrollmentStatus, enumName: 'enrollment_status', default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;

  @Column({ type: 'timestamptz', name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'withdrawn_at' })
  withdrawnAt: Date;

  @ManyToOne(() => CourseEntity, (course) => course.enrollments)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @ManyToOne(() => StudentEntity)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
