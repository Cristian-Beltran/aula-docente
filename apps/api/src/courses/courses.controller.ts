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
import { CoursesService } from './courses.service';

@ApiTags('courses')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.service.findAll(query, user.id, user.role === UserRole.ADMIN);
  }

  @Get(':id')
  @UseGuards(CourseOwnerGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createDto: any) {
    return this.service.create({
      ...createDto,
      teacherId: createDto.teacherId ?? user.id,
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

  @Get(':id/enrollments')
  @UseGuards(CourseOwnerGuard)
  getEnrollments(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.getEnrollments(id, query);
  }
}
