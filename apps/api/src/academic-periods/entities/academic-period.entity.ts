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
import { CourseEntity } from '../../courses/entities/course.entity';

export enum PeriodStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

@Entity('academic_periods')
export class AcademicPeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'enum', enum: PeriodStatus, enumName: 'period_status', default: PeriodStatus.DRAFT })
  status: PeriodStatus;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @OneToMany(() => CourseEntity, (course) => course.academicPeriod)
  courses: CourseEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
