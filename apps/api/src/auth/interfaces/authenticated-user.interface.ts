import { UserRole } from '../../common/entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  sessionId?: string;
}
