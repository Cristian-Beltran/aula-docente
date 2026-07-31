import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExceptionRequestEntity } from './exception-request.entity';
import { UserEntity } from '../../common/entities/user.entity';

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'exception_request_id' })
  exceptionRequestId: string;

  @Column({ type: 'text', name: 'storage_key' })
  storageKey: string;

  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  originalName: string;

  @Column({ type: 'varchar', length: 120, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'bigint', name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'char', length: 64, nullable: true, name: 'checksum_sha256' })
  checksumSha256: string;

  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedById: string;

  @ManyToOne(() => ExceptionRequestEntity, (request) => request.attachments)
  @JoinColumn({ name: 'exception_request_id' })
  exceptionRequest: ExceptionRequestEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
