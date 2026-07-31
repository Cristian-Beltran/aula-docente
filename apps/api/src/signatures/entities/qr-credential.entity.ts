import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EnrollmentEntity } from '../../courses/entities/enrollment.entity';
import { UserEntity } from '../../common/entities/user.entity';

@Entity('qr_credentials')
export class QrCredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ type: 'text', name: 'token_hash' })
  tokenHash: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @ManyToOne(() => EnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: EnrollmentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
