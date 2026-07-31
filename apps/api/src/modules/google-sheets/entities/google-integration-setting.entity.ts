import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../../common/entities/user.entity';

@Entity('google_integration_settings')
export class GoogleIntegrationSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @Column({ type: 'varchar', length: 200, name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 254, name: 'service_account_email' })
  serviceAccountEmail: string;

  @Column({ type: 'text', name: 'encrypted_private_key' })
  encryptedPrivateKey: string;

  @Column({ type: 'varchar', length: 254, nullable: true, name: 'share_with_email' })
  shareWithEmail: string;

  @Column({ type: 'varchar', length: 40, default: 'ACTIVE' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_validated_at' })
  lastValidatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
