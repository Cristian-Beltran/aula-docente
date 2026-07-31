import { UserRole } from '../../common/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  type: 'access' | 'refresh';
}
