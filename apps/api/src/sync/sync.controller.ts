import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/entities/user.entity';
import { SyncService } from './sync.service';

@ApiTags('sync')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post('batch')
  receiveBatch(@Body() body: { operations: any[] }) {
    return this.service.receiveBatch(body.operations);
  }

  @Get('device/:deviceId')
  findByDevice(@Param('deviceId') deviceId: string) {
    return this.service.findByDevice(deviceId);
  }
}
