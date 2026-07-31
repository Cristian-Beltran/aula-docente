import { Controller, Put, Post, Get, Delete, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/entities/user.entity';
import { AuthenticatedUser } from '../../../auth/interfaces/authenticated-user.interface';
import { GoogleAuthService } from '../services/google-auth.service';
import { GoogleIntegrationSettingEntity } from '../entities/google-integration-setting.entity';

@ApiTags('google-integration')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('integrations/google-sheets')
export class GoogleIntegrationController {
  constructor(
    @InjectRepository(GoogleIntegrationSettingEntity)
    private readonly settingRepo: Repository<GoogleIntegrationSettingEntity>,
    private readonly authService: GoogleAuthService,
  ) {}

  @Put('credentials')
  async saveCredentials(@CurrentUser() user: AuthenticatedUser, @Body() body: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    shareWithEmail?: string;
  }) {
    let finalEncryptedKey: string;

    if (body.privateKey === 'KEEP_EXISTING') {
      const prev = await this.settingRepo.findOne({
        where: { ownerUserId: user.id, status: 'ACTIVE' },
      });
      if (!prev?.encryptedPrivateKey) {
        throw new BadRequestException('Se requiere la clave privada');
      }
      finalEncryptedKey = prev.encryptedPrivateKey;
    } else {
      finalEncryptedKey = this.authService.encrypt(body.privateKey);
    }

    await this.settingRepo.update({ ownerUserId: user.id, status: 'ACTIVE' }, { status: 'DELETED' });

    const entity = this.settingRepo.create({
      ownerUserId: user.id,
      projectId: body.projectId,
      serviceAccountEmail: body.clientEmail,
      encryptedPrivateKey: finalEncryptedKey,
      shareWithEmail: body.shareWithEmail || undefined,
      status: 'ACTIVE',
    });

    await this.settingRepo.save(entity);
    return { configured: true, status: 'ACTIVE' };
  }

  @Post('test')
  async testConnection(@CurrentUser() user: AuthenticatedUser) {
    const setting = await this.settingRepo.findOne({
      where: { ownerUserId: user.id, status: 'ACTIVE' },
    });
    if (!setting) return { connected: false, message: 'Sin configuración activa' };

    try {
      const ok = await this.authService.testConnection(setting);
      if (ok) {
        await this.settingRepo.update(setting.id, { lastValidatedAt: new Date() });
        return { connected: true };
      }
      return { connected: false, message: 'Falló la conexión. Revisa las credenciales.' };
    } catch (error: any) {
      return {
        connected: false,
        message: error?.message || 'Error al probar conexión',
        detail: error?.response?.data || error?.code || '',
      };
    }
  }

  @Get('status')
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    const setting = await this.settingRepo.findOne({
      where: { ownerUserId: user.id, status: 'ACTIVE' },
    });
    if (!setting) return { configured: false };
    return {
      configured: true,
      projectId: setting.projectId,
      clientEmail: setting.serviceAccountEmail,
      shareWithEmail: setting.shareWithEmail,
      status: setting.status,
      lastValidatedAt: setting.lastValidatedAt,
    };
  }

  @Delete('credentials')
  async removeCredentials(@CurrentUser() user: AuthenticatedUser) {
    await this.settingRepo.delete({ ownerUserId: user.id, status: 'ACTIVE' });
    return { configured: false };
  }
}
