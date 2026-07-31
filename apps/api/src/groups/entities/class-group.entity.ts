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
import { GroupMembershipEntity } from './group-membership.entity';

export enum GroupType {
  LAB = 'LAB',
  PRACTICE = 'PRACTICE',
  PROJECT = 'PROJECT',
  CUSTOM = 'CUSTOM',
}

@Entity('class_groups')
export class ClassGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id' })
  courseId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 40 })
  code: string;

  @Column({ type: 'enum', enum: GroupType, enumName: 'group_type' })
  type: GroupType;

  @Column({ type: 'jsonb', default: [] })
  schedule: any[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => CourseEntity, (course) => course.groups)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @OneToMany(() => GroupMembershipEntity, (membership) => membership.classGroup)
  memberships: GroupMembershipEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
