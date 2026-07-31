import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CourseOwnerGuard } from '../auth/guards/course-owner.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/entities/user.entity';
import { SignaturesService } from './signatures.service';

@ApiTags('signatures')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('signatures')
export class SignaturesController {
  constructor(private readonly service: SignaturesService) {}

  @Get('course/:courseId')
  @UseGuards(CourseOwnerGuard)
  findByCourse(@Param('courseId') courseId: string, @Query() query: PaginationQueryDto) {
    return this.service.findByCourse(courseId, query);
  }

  @Post()
  @UseGuards(CourseOwnerGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() createDto: any) {
    return this.service.createSignature({
      ...createDto,
      registeredById: user.id,
    });
  }

  @Post('validate-qr')
  @UseGuards(CourseOwnerGuard)
  validateQr(@Body() body: { token: string; courseId: string }) {
    return this.service.validateQr(body.token);
  }
}
