import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClassGroupEntity } from './class-group.entity';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { UserEntity } from '../../common/entities/user.entity';

@Entity('group_memberships')
export class GroupMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'class_group_id' })
  classGroupId: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'timestamptz', name: 'assigned_at' })
  assignedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'removed_at' })
  removedAt: Date;

  @Column({ type: 'uuid', name: 'assigned_by' })
  assignedById: string;

  @Column({ type: 'text', nullable: true, name: 'removal_reason' })
  removalReason: string;

  @ManyToOne(() => ClassGroupEntity, (group) => group.memberships)
  @JoinColumn({ name: 'class_group_id' })
  classGroup: ClassGroupEntity;

  @ManyToOne(() => EnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: EnrollmentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'assigned_by' })
  assignedBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
