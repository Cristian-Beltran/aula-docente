import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseEntity } from '../../../courses/entities/course.entity';
import { GoogleIntegrationSettingEntity } from './google-integration-setting.entity';

@Entity('course_spreadsheets')
export class CourseSpreadsheetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'course_id', unique: true })
  courseId: string;

  @Column({ type: 'uuid', nullable: true, name: 'google_integration_setting_id' })
  googleIntegrationSettingId: string;

  @Column({ type: 'varchar', length: 120, nullable: true, unique: true, name: 'spreadsheet_id' })
  spreadsheetId: string;

  @Column({ type: 'text', nullable: true, name: 'spreadsheet_url' })
  spreadsheetUrl: string;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'spreadsheet_name' })
  spreadsheetName: string;

  @Column({ type: 'integer', default: 1, name: 'template_version' })
  templateVersion: number;

  @Column({ type: 'varchar', length: 40, default: 'NOT_CONFIGURED' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_synced_at' })
  lastSyncedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'last_synced_class_id' })
  lastSyncedClassId: string;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @ManyToOne(() => GoogleIntegrationSettingEntity)
  @JoinColumn({ name: 'google_integration_setting_id' })
  integrationSetting: GoogleIntegrationSettingEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
