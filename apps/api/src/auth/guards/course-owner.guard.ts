import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ActivityEntity } from '../../signatures/entities/activity.entity';
import { AttendanceRecordEntity } from '../../attendance/entities/attendance-record.entity';
import { ExceptionRequestEntity } from '../../exceptions/entities/exception-request.entity';
import { ClassGroupEntity } from '../../groups/entities/class-group.entity';
import { ClassSessionEntity } from '../../lessons/entities/class-session.entity';
import { LessonEntity } from '../../lessons/entities/lesson.entity';
import { UserRole } from '../../common/entities/user.entity';
import { CourseEntity } from '../../courses/entities/course.entity';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class CourseOwnerGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const courseId = await this.resolveCourseId(request);
    if (!courseId) {
      throw new ForbiddenException('No se pudo determinar el curso para autorizar la operación.');
    }

    const course = await this.dataSource.getRepository(CourseEntity).findOne({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });

    if (!course || course.teacherId !== user.id) {
      throw new ForbiddenException('No tienes acceso a este curso.');
    }

    return true;
  }

  private async resolveCourseId(request: {
    params?: Record<string, string>;
    body?: Record<string, string>;
    query?: Record<string, string>;
    originalUrl?: string;
  }): Promise<string | null> {
    const directCourseId =
      request.params?.courseId ||
      request.body?.courseId ||
      request.query?.courseId ||
      (this.isCoursesRoute(request) ? request.params?.id : undefined);

    if (directCourseId) {
      return directCourseId;
    }

    if (this.isGroupsRoute(request)) {
      const group = await this.dataSource.getRepository(ClassGroupEntity).findOne({
        where: { id: request.params?.id ?? request.params?.groupId },
        select: { courseId: true },
      });
      return group?.courseId ?? null;
    }

    if (this.isLessonsRoute(request)) {
      const lesson = await this.dataSource.getRepository(LessonEntity).findOne({
        where: { id: request.params?.id ?? request.params?.lessonId },
        select: { courseId: true },
      });
      return lesson?.courseId ?? null;
    }

    if (this.isAttendanceRoute(request)) {
      const sessionId = request.params?.sessionId;
      if (sessionId) {
        const session = await this.dataSource.getRepository(ClassSessionEntity).findOne({
          where: { id: sessionId },
          select: { courseId: true },
        });
        return session?.courseId ?? null;
      }

      const attendance = await this.dataSource.getRepository(AttendanceRecordEntity).findOne({
        where: { id: request.params?.id },
        select: { classSessionId: true },
      });

      if (!attendance?.classSessionId) {
        return null;
      }

      const session = await this.dataSource.getRepository(ClassSessionEntity).findOne({
        where: { id: attendance.classSessionId },
        select: { courseId: true },
      });
      return session?.courseId ?? null;
    }

    if (this.isExceptionsRoute(request)) {
      const exception = await this.dataSource.getRepository(ExceptionRequestEntity).findOne({
        where: { id: request.params?.id },
        select: { courseId: true },
      });
      return exception?.courseId ?? null;
    }

    if (this.isSignaturesRoute(request) && request.body?.activityId) {
      const activity = await this.dataSource.getRepository(ActivityEntity).findOne({
        where: { id: request.body.activityId },
        select: { courseId: true },
      });
      return activity?.courseId ?? null;
    }

    if (this.isSessionsRoute(request)) {
      const session = await this.dataSource.getRepository(ClassSessionEntity).findOne({
        where: { id: request.params?.id ?? request.body?.classSessionId },
        select: { courseId: true },
      });
      return session?.courseId ?? null;
    }

    return null;
  }

  private isCoursesRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/courses/') ?? false;
  }

  private isGroupsRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/groups/') ?? false;
  }

  private isLessonsRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/lessons/') ?? false;
  }

  private isAttendanceRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/attendance/') ?? false;
  }

  private isExceptionsRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/exceptions/') ?? false;
  }

  private isSignaturesRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/signatures/') ?? false;
  }

  private isSessionsRoute(request: { originalUrl?: string }): boolean {
    return request.originalUrl?.includes('/sessions') ?? false;
  }
}
