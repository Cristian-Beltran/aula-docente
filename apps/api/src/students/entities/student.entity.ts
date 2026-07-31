import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('students')
export class StudentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180, nullable: true, name: 'full_name' })
  fullName: string | null;

  @Column({ type: 'varchar', length: 60, unique: true, name: 'student_code' })
  studentCode: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 120, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 40, nullable: true, name: 'identity_number' })
  identityNumber: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true, name: 'photo_url' })
  photoUrl: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
