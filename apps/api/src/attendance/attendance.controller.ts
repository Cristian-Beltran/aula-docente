import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CourseOwnerGuard } from '../auth/guards/course-owner.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/entities/user.entity';
import { AttendanceService } from './attendance.service';

@ApiTags('attendance')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('session/:sessionId')
  @UseGuards(CourseOwnerGuard)
  findBySession(@Param('sessionId') sessionId: string, @Query() query: PaginationQueryDto) {
    return this.service.findBySession(sessionId, query);
  }

  @Post()
  @UseGuards(CourseOwnerGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() createDto: any) {
    return this.service.create({
      ...createDto,
      registeredById: user.id,
    });
  }

  @Put(':id')
  @UseGuards(CourseOwnerGuard)
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.service.update(id, updateDto);
  }
}
