import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { UserEntity } from '../common/entities/user.entity';
import { UserSessionEntity } from './entities/user-session.entity';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SessionQueryDto } from './dto/session-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';

export interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSessionEntity)
    private readonly sessionRepository: Repository<UserSessionEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    return user;
  }

  async login(loginDto: LoginDto, meta: RequestMeta) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const rememberMe = loginDto.rememberMe ?? false;
    const sessionId = randomUUID();
    const tokens = await this.issueTokens(user, sessionId);
    const session = this.sessionRepository.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: await argon2.hash(tokens.refreshToken),
      rememberMe,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt: this.getRefreshExpirationDate(rememberMe),
      lastUsedAt: new Date(),
    });

    const savedSession = await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      access_token: tokens.accessToken,
      expiresIn: this.parseDurationToSeconds(
        this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      ),
      refreshToken: tokens.refreshToken,
      rememberMe,
      user: this.toAuthUser(user, savedSession.id),
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      where: { id: payload.sessionId, userId: payload.sub },
      relations: ['user'],
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('La sesión ya no es válida.');
    }

    const matches = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!matches) {
      await this.revokeSessionInternal(session.id);
      throw new UnauthorizedException('El refresh token no es válido.');
    }

    session.lastUsedAt = new Date();
    session.ipAddress = meta.ipAddress ?? session.ipAddress;
    session.userAgent = meta.userAgent ?? session.userAgent;
    session.expiresAt = this.getRefreshExpirationDate(session.rememberMe);

    const tokens = await this.issueTokens(session.user, session.id);
    session.refreshTokenHash = await argon2.hash(tokens.refreshToken);
    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      access_token: tokens.accessToken,
      expiresIn: this.parseDurationToSeconds(
        this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      ),
      refreshToken: tokens.refreshToken,
      rememberMe: session.rememberMe,
      user: this.toAuthUser(session.user, session.id),
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.revokeSessionInternal(payload.sessionId);
    } catch {
      return;
    }
  }

  async logoutAll(userId: string) {
    await this.sessionRepository
      .createQueryBuilder()
      .update(UserSessionEntity)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new ForbiddenException('No puedes cerrar una sesión ajena.');
    }

    await this.revokeSessionInternal(session.id);
  }

  async getSessions(userId: string, query: SessionQueryDto) {
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId })
      .orderBy('session.created_at', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(COALESCE(session.user_agent, \'\') ILIKE :search OR COALESCE(session.ip_address::text, \'\') ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const paginated = await paginateQueryBuilder(qb, query);
    return {
      ...paginated,
      items: paginated.items.map((session) => ({
        id: session.id,
        rememberMe: session.rememberMe,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
      })),
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async buildAuthenticatedUser(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido.');
    }

    const user = await this.findById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario no autorizado.');
    }

    return this.toAuthUser(user, payload.sessionId);
  }

  getRefreshCookieName(): string {
    return this.configService.get<string>('AUTH_REFRESH_COOKIE_NAME', 'aula_refresh_token');
  }

  buildRefreshCookieOptions(rememberMe: boolean) {
    const sameSite = this.configService.get<'lax' | 'strict' | 'none'>(
      'AUTH_COOKIE_SAME_SITE',
      'lax',
    );
    const secure =
      this.configService.get<string>('AUTH_COOKIE_SECURE', 'false').toLowerCase() === 'true';

    return {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
      maxAge: rememberMe
        ? this.parseDurationToMilliseconds(
            this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
          )
        : this.parseDurationToMilliseconds(
            this.configService.get<string>('JWT_SESSION_EXPIRES_IN', '1d'),
          ),
    };
  }

  clearRefreshCookieOptions() {
    return {
      ...this.buildRefreshCookieOptions(true),
      maxAge: 0,
    };
  }

  private async issueTokens(user: UserEntity, sessionId: string) {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      ...accessPayload,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token inválido.');
    }
  }

  private async revokeSessionInternal(sessionId: string) {
    await this.sessionRepository.update(sessionId, {
      revokedAt: new Date(),
    });
  }

  private getRefreshExpirationDate(rememberMe: boolean): Date {
    const ms = this.parseDurationToMilliseconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    const sessionMs = this.parseDurationToMilliseconds(
      this.configService.get<string>('JWT_SESSION_EXPIRES_IN', '1d'),
    );
    return new Date(Date.now() + (rememberMe ? ms : sessionMs));
  }

  private parseDurationToMilliseconds(input: string): number {
    const match = /^(\d+)([smhd])$/i.exec(input.trim());
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  private parseDurationToSeconds(input: string): number {
    return Math.floor(this.parseDurationToMilliseconds(input) / 1000);
  }

  private toAuthUser(user: UserEntity, sessionId?: string): AuthenticatedUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active,
      sessionId,
    };
  }
}
