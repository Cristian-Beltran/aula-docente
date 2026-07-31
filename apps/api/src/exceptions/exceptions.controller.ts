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
import { ExceptionsService } from './exceptions.service';

@ApiTags('exceptions')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exceptions')
export class ExceptionsController {
  constructor(private readonly service: ExceptionsService) {}

  @Get('course/:courseId')
  @UseGuards(CourseOwnerGuard)
  findByCourse(
    @Param('courseId') courseId: string,
    @Query() query: PaginationQueryDto & { status?: string },
  ) {
    return this.service.findByCourse(courseId, query);
  }

  @Get(':id')
  @UseGuards(CourseOwnerGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(CourseOwnerGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() createDto: any) {
    return this.service.create({
      ...createDto,
      requestedById: user.id,
      requestedAt: new Date(),
    });
  }

  @Put(':id/resolve')
  @UseGuards(CourseOwnerGuard)
  resolve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() resolveDto: any) {
    return this.service.resolve(id, {
      ...resolveDto,
      resolvedById: user.id,
    });
  }

  @Post('attachments')
  @UseGuards(CourseOwnerGuard)
  addAttachment(@Body() createDto: any) {
    return this.service.addAttachment(createDto);
  }
}
