import {
  Body,
  Controller,
  Delete,
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
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly service: LessonsService) {}

  @Get('course/:courseId')
  @UseGuards(CourseOwnerGuard)
  findByCourse(@Param('courseId') courseId: string, @Query() query: PaginationQueryDto) {
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
      createdById: user.id,
    });
  }

  @Put(':id')
  @UseGuards(CourseOwnerGuard)
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(CourseOwnerGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/sessions')
  @UseGuards(CourseOwnerGuard)
  getSessions(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.getSessionsByLesson(id, query);
  }

  @Post('sessions')
  @UseGuards(CourseOwnerGuard)
  createSession(@CurrentUser() user: AuthenticatedUser, @Body() createDto: any) {
    return this.service.createSession({
      ...createDto,
      createdById: user.id,
    });
  }
}
