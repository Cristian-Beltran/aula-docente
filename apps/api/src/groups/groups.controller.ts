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
import { CourseOwnerGuard } from '../auth/guards/course-owner.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/entities/user.entity';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

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
  create(@Body() createDto: any) {
    return this.service.create(createDto);
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

  @Get(':id/memberships')
  @UseGuards(CourseOwnerGuard)
  getMemberships(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.service.getMemberships(id, query);
  }
}
