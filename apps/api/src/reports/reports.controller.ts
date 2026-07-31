import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CourseOwnerGuard } from '../auth/guards/course-owner.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/entities/user.entity';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('courses/:courseId/summary')
  @UseGuards(CourseOwnerGuard)
  getCourseSummary(@Param('courseId') courseId: string) {
    return this.service.getCourseSummary(courseId);
  }

  @Get('courses/:courseId/groups-comparison')
  @UseGuards(CourseOwnerGuard)
  getGroupsComparison(@Param('courseId') courseId: string, @Query() query: PaginationQueryDto) {
    return this.service.getGroupsComparison(courseId, query);
  }

  @Get('courses/:courseId/activities/:activityId/signatures')
  @UseGuards(CourseOwnerGuard)
  getActivitySignatures(
    @Param('courseId') courseId: string,
    @Param('activityId') activityId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.getActivitySignatures(courseId, activityId, query);
  }

  @Get('courses/:courseId/sessions/:sessionId/attendance')
  @UseGuards(CourseOwnerGuard)
  getSessionAttendance(
    @Param('courseId') courseId: string,
    @Param('sessionId') sessionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.getSessionAttendance(courseId, sessionId, query);
  }

  @Get('courses/:courseId/risk-students')
  @UseGuards(CourseOwnerGuard)
  getRiskStudents(@Param('courseId') courseId: string, @Query() query: PaginationQueryDto) {
    return this.service.getRiskStudents(courseId, query);
  }

  @Get('courses/:courseId/exceptions')
  @UseGuards(CourseOwnerGuard)
  getCourseExceptions(@Param('courseId') courseId: string, @Query() query: PaginationQueryDto) {
    return this.service.getCourseExceptions(courseId, query);
  }
}
