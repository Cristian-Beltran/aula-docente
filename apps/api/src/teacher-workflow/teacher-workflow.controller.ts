import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/entities/user.entity';
import { TeacherWorkflowService } from './teacher-workflow.service';

@ApiTags('teacher-workflow')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-workflow')
export class TeacherWorkflowController {
  constructor(private readonly service: TeacherWorkflowService) {}

  @Get('periods')
  listPeriods(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listAcademicPeriods(user.id, user.role === UserRole.ADMIN);
  }

  @Post('periods')
  createPeriod(@CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    return this.service.createAcademicPeriod(body, user.id);
  }

  @Put('periods/:id')
  updatePeriod(@Param('id') id: string, @Body() body: any) {
    return this.service.updateAcademicPeriod(id, body);
  }

  @Get('courses')
  listCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listCourses(user.id, user.role === UserRole.ADMIN);
  }

  @Post('courses')
  createCourse(@CurrentUser() user: AuthenticatedUser, @Body() body: any) {
    return this.service.createCourse(body, user.id);
  }

  @Put('courses/:id')
  updateCourse(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCourse(id, body);
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.service.removeCourse(id);
  }

  @Post('courses/:courseId/students')
  registerStudent(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.registerStudent(courseId, body, user.id);
  }

  @Post('courses/:courseId/students/bulk')
  bulkRegisterStudents(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { fullNames: string[] | string },
  ) {
    return this.service.bulkRegisterStudents(courseId, body, user.id);
  }

  @Get('courses/:courseId/groups')
  listGroups(@Param('courseId') courseId: string) {
    return this.service.listCourseGroups(courseId);
  }

  @Post('courses/:courseId/groups')
  createGroup(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.createCourseGroup(courseId, body, user.id);
  }

  @Put('courses/:courseId/groups/:groupId')
  updateGroup(@Param('courseId') courseId: string, @Param('groupId') groupId: string, @Body() body: any) {
    return this.service.updateCourseGroup(courseId, groupId, body);
  }

  @Delete('courses/:courseId/groups/:groupId')
  removeGroup(@Param('courseId') courseId: string, @Param('groupId') groupId: string) {
    return this.service.removeCourseGroup(courseId, groupId);
  }

  @Put('courses/:courseId/groups/:groupId/members')
  replaceGroupMembers(
    @Param('courseId') courseId: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { enrollmentIds: string[] },
  ) {
    return this.service.replaceGroupMembers(courseId, groupId, body.enrollmentIds || [], user.id);
  }

  @Get('courses/:courseId/students')
  listCourseStudents(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.listCourseStudents(courseId, Number(page || 1), search, Number(pageSize || 25));
  }

  @Get('courses/:courseId/qr-cards')
  getQrCards(
    @Param('courseId') courseId: string,
    @Query('enrollmentId') enrollmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCourseQrCards(courseId, { enrollmentId, search });
  }

  @Get('courses/:courseId/qr-pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="qr-cards.pdf"')
  async getQrPdf(@Param('courseId') courseId: string, @Res({ passthrough: true }) res: Response) {
    const pdf = await this.service.generateQrPdf(courseId);
    res.end(pdf);
  }

  @Put('courses/:courseId/schedule')
  saveSchedule(@Param('courseId') courseId: string, @Body() body: { schedule: any[] }) {
    return this.service.saveCourseSchedule(courseId, body.schedule || []);
  }

  @Post('courses/:courseId/additional-sessions')
  createAdditionalSession(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.createAdditionalSession(courseId, body, user.id);
  }

  @Get('courses/:courseId/additional-sessions')
  listAdditionalSessions(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listAdditionalSessions(courseId, Number(page || 1), search);
  }

  @Put('additional-sessions/:sessionId')
  updateAdditionalSession(
    @Param('sessionId') sessionId: string,
    @Body() body: any,
  ) {
    return this.service.updateAdditionalSession(sessionId, body);
  }

  @Delete('additional-sessions/:sessionId')
  deleteAdditionalSession(@Param('sessionId') sessionId: string) {
    return this.service.deleteAdditionalSession(sessionId);
  }

  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser, @Query('date') date?: string) {
    return this.service.getDailyAgenda(user.id, date);
  }

  @Get('week')
  getWeek(@CurrentUser() user: AuthenticatedUser, @Query('date') date?: string) {
    return this.service.getWeeklyAgenda(user.id, date);
  }

  @Get('current-session')
  getCurrentSession(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getCurrentSession(user.id);
  }

  @Post('sessions/:sessionId/open')
  openSession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.openSession(sessionId, user.id);
  }

  @Get('sessions/:sessionId/roster')
  getRoster(@Param('sessionId') sessionId: string) {
    return this.service.getSessionRoster(sessionId);
  }

  @Get('sessions/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.service.getSessionDetail(sessionId);
  }

  @Post('sessions/:sessionId/attendance')
  registerAttendance(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.registerAttendance(sessionId, body, user.id);
  }

  @Patch('sessions/:sessionId/log')
  updateSessionLog(@Param('sessionId') sessionId: string, @Body() body: any) {
    return this.service.updateSessionLog(sessionId, body);
  }

  @Post('sessions/:sessionId/log/improve')
  improveSessionLog(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.improveSessionLog(sessionId, body, user.id);
  }

  @Post('sessions/:sessionId/complete')
  completeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.completeSession(sessionId, body, user.id);
  }

  @Patch('sessions/:sessionId/partial')
  updatePartial(@Param('sessionId') sessionId: string, @Body() body: { partial: number }) {
    return this.service.updateSessionPartial(sessionId, body.partial);
  }

  @Get('sessions/:sessionId/activities')
  listActivities(@Param('sessionId') sessionId: string) {
    return this.service.listSessionActivities(sessionId);
  }

  @Post('sessions/:sessionId/activities')
  createActivity(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.createActivity(sessionId, body, user.id);
  }

  @Patch('activities/:activityId')
  updateActivity(@Param('activityId') activityId: string, @Body() body: any) {
    return this.service.updateActivity(activityId, body);
  }

  @Delete('activities/:activityId')
  deleteActivity(@Param('activityId') activityId: string) {
    return this.service.deleteActivity(activityId);
  }

  @Post('activities/:activityId/scan')
  scanForActivity(
    @Param('activityId') activityId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.scanActivity(activityId, body, user.id);
  }

  @Patch('sessions/:sessionId/activities/:activityId/students/:enrollmentId')
  updateStudentActivityResult(
    @Param('sessionId') sessionId: string,
    @Param('activityId') activityId: string,
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.service.updateStudentActivityResult(sessionId, activityId, enrollmentId, body, user.id);
  }
}
