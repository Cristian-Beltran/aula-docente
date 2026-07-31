import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSessionEntity } from '../../auth/entities/user-session.entity';
import { CourseEntity } from '../../courses/entities/course.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  ASSISTANT = 'ASSISTANT',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.TEACHER })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CourseEntity, (course) => course.teacher)
  courses: CourseEntity[];

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions: UserSessionEntity[];
}
