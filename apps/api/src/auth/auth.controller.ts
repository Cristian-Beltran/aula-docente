import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SessionQueryDto } from './dto/session-query.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto, this.getRequestMeta(request));

    response.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.buildRefreshCookieOptions(loginDto.rememberMe ?? false),
    );

    const { refreshToken, ...payload } = result;
    return payload;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.extractRefreshToken(request);
    if (!refreshToken) {
      throw new HttpException('Refresh token no encontrado.', HttpStatus.UNAUTHORIZED);
    }
    const result = await this.authService.refresh(refreshToken, this.getRequestMeta(request));

    response.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.buildRefreshCookieOptions(result.rememberMe),
    );

    const { refreshToken: _refreshToken, ...payload } = result;
    return payload;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión actual' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(this.extractRefreshToken(request, false));
    response.clearCookie(
      this.authService.getRefreshCookieName(),
      this.authService.clearRefreshCookieOptions(),
    );
    return { message: 'Sesión cerrada correctamente.' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar todas las sesiones' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(user.id);
    response.clearCookie(
      this.authService.getRefreshCookieName(),
      this.authService.clearRefreshCookieOptions(),
    );
    return { message: 'Todas las sesiones fueron cerradas.' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar sesiones activas del usuario' })
  getSessions(@CurrentUser() user: AuthenticatedUser, @Query() query: SessionQueryDto) {
    return this.authService.getSessions(user.id, query);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar una sesión específica' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(user.id, sessionId);
    return { message: 'Sesión revocada correctamente.' };
  }

  private getRequestMeta(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }

  private extractRefreshToken(request: Request, required = true): string | undefined {
    const cookieName = this.authService.getRefreshCookieName();
    const cookies = request.headers.cookie ?? '';
    const raw = cookies
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);

    if (!raw && required) {
      throw new HttpException('Refresh token no encontrado.', HttpStatus.UNAUTHORIZED);
    }

    return raw ? decodeURIComponent(raw) : undefined;
  }
}
