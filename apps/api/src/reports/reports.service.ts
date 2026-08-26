import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecordEntity, AttendanceStatus } from '../attendance/entities/attendance-record.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPaginationMeta, paginateQueryBuilder } from '../common/utils/pagination.util';
import { CourseEntity } from '../courses/entities/course.entity';
import { EnrollmentEntity, EnrollmentStatus } from '../courses/entities/enrollment.entity';
import { ExceptionRequestEntity, ExceptionStatus } from '../exceptions/entities/exception-request.entity';
import { ClassGroupEntity } from '../groups/entities/class-group.entity';
import { ClassSessionEntity } from '../lessons/entities/class-session.entity';
import { ActivityEntity, ActivityGradingMode } from '../signatures/entities/activity.entity';
import { ScoreRecordEntity } from '../signatures/entities/score-record.entity';
import { SignatureRecordEntity } from '../signatures/entities/signature-record.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(ClassGroupEntity)
    private readonly groupRepository: Repository<ClassGroupEntity>,
    @InjectRepository(ClassSessionEntity)
    private readonly sessionRepository: Repository<ClassSessionEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
    @InjectRepository(ScoreRecordEntity)
    private readonly scoreRepository: Repository<ScoreRecordEntity>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepository: Repository<AttendanceRecordEntity>,
    @InjectRepository(SignatureRecordEntity)
    private readonly signatureRepository: Repository<SignatureRecordEntity>,
    @InjectRepository(ExceptionRequestEntity)
    private readonly exceptionRepository: Repository<ExceptionRequestEntity>,
  ) {}

  async getCourseSummary(courseId: string) {
    const [
      students,
      sessions,
      signatures,
      attendance,
      pendingExceptions,
    ] = await Promise.all([
      this.enrollmentRepository.count({
        where: { courseId, status: EnrollmentStatus.ACTIVE },
      }),
      this.sessionRepository.count({ where: { courseId } }),
      this.signatureRepository
        .createQueryBuilder('signature')
        .leftJoin('signature.activity', 'activity')
        .where('activity.course_id = :courseId', { courseId })
        .andWhere('signature.canceled_at IS NULL')
        .getCount(),
      this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoin('attendance.classSession', 'session')
        .where('session.course_id = :courseId', { courseId })
        .select([
          `COUNT(*) FILTER (WHERE attendance.effective_status IN ('${AttendanceStatus.PRESENT}', '${AttendanceStatus.LATE}', '${AttendanceStatus.EARLY_LEAVE}')) AS present_count`,
          `COUNT(*) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.ABSENT}') AS absent_count`,
          `COUNT(*) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.JUSTIFIED}') AS justified_count`,
        ])
        .getRawOne(),
      this.exceptionRepository.count({
        where: { courseId, status: ExceptionStatus.PENDING },
      }),
    ]);

    return {
      courseId,
      students,
      sessions,
      signatures,
      attendance: {
        present: Number(attendance?.present_count ?? 0),
        late: 0,
        absent: Number(attendance?.absent_count ?? 0),
        justified: Number(attendance?.justified_count ?? 0),
      },
      pendingExceptions,
    };
  }

  async getGroupsComparison(courseId: string, query: PaginationQueryDto) {
    const qb = this.groupRepository
      .createQueryBuilder('group')
      .leftJoin('group.memberships', 'membership', 'membership.removed_at IS NULL')
      .leftJoin('class_sessions', 'session', 'session.class_group_id = group.id')
      .where('group.course_id = :courseId', { courseId })
      .select([
        'group.id AS id',
        'group.name AS name',
        'group.code AS code',
        'COUNT(DISTINCT membership.id) AS activeMembers',
        'COUNT(DISTINCT session.id) AS sessions',
      ])
      .groupBy('group.id')
      .addGroupBy('group.name')
      .addGroupBy('group.code');

    if (query.search) {
      qb.andWhere('(group.name ILIKE :search OR group.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const countQb = this.groupRepository
      .createQueryBuilder('group')
      .select('COUNT(DISTINCT group.id)', 'total')
      .where('group.course_id = :courseId', { courseId });
    if (query.search) {
      countQb.andWhere('(group.name ILIKE :search OR group.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    const countResult = await countQb.getRawOne();
    const total = Number(countResult?.total ?? 0);
    const items = await qb.offset((page - 1) * pageSize).limit(pageSize).getRawMany();

    return {
      items,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async getActivitySignatures(courseId: string, activityId: string, query: PaginationQueryDto) {
    const qb = this.signatureRepository
      .createQueryBuilder('signature')
      .leftJoinAndSelect('signature.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('signature.activity', 'activity')
      .where('signature.activity_id = :activityId', { activityId })
      .andWhere('activity.course_id = :courseId', { courseId });

    if (query.search) {
      qb.andWhere(
        '(student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(
      `signature.${query.sortBy ?? 'registeredAt'}`,
      query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );

    return paginateQueryBuilder(qb, query);
  }

  async getSessionAttendance(courseId: string, sessionId: string, query: PaginationQueryDto) {
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('attendance.classSession', 'session')
      .where('attendance.class_session_id = :sessionId', { sessionId })
      .andWhere('session.course_id = :courseId', { courseId });

    if (query.search) {
      qb.andWhere(
        '(student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(
      `attendance.${query.sortBy ?? 'createdAt'}`,
      query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );

    return paginateQueryBuilder(qb, query);
  }

  async getRiskStudents(courseId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const absenceExpr = `COUNT(DISTINCT attendance.id) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.ABSENT}')`;
    const baseQuery = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.student', 'student')
      .leftJoin('attendance_records', 'attendance', 'attendance.enrollment_id = enrollment.id')
      .leftJoin(
        'signature_records',
        'signature',
        'signature.enrollment_id = enrollment.id AND signature.canceled_at IS NULL',
      )
      .where('enrollment.course_id = :courseId', { courseId })
      .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      .select([
        'enrollment.id AS enrollmentId',
        'student.id AS studentId',
        'student.student_code AS studentCode',
        'student.full_name AS studentFullName',
        'student.first_name AS firstName',
        'student.last_name AS lastName',
        `${absenceExpr} AS absences`,
        'COALESCE(SUM(signature.quantity), 0) AS signatures',
      ])
      .groupBy('enrollment.id')
      .addGroupBy('student.id')
      .having(`${absenceExpr} > 0`);

    if (query.search) {
      baseQuery.andWhere(
        '(student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search OR student.full_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const countResult = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('attendance_records', 'attendance', 'attendance.enrollment_id = enrollment.id')
      .select(`COUNT(DISTINCT enrollment.id) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.ABSENT}')`, 'total')
      .leftJoin('enrollment.student', 'student')
      .where('enrollment.course_id = :courseId', { courseId })
      .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      .getRawOne();
    const total = Number(countResult?.total ?? 0);

    const items = await baseQuery
      .orderBy('absences', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return {
      items: items.map((item) => ({
        enrollmentId: item.enrollmentId ?? item.enrollmentid,
        studentId: item.studentId ?? item.studentid,
        studentCode: item.studentCode ?? item.studentcode,
        studentFullName: item.studentFullName ?? item.studentfullname,
        firstName: item.firstName ?? item.firstname ?? '',
        lastName: item.lastName ?? item.lastname ?? '',
        absences: Number(item.absences ?? 0),
        lates: 0,
        signatures: Number(item.signatures ?? 0),
      })),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async getMobileSummary(courseId: string) {
    const course = await this.enrollmentRepository.manager.getRepository(CourseEntity).findOne({
      where: { id: courseId },
      relations: ['subject', 'academicPeriod'],
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { courseId, status: EnrollmentStatus.ACTIVE },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });

    const sessions = await this.sessionRepository.find({
      where: { courseId },
      order: { sessionDate: 'ASC', startsAt: 'ASC' },
    });

    const sessionIds = sessions.map((session) => session.id);
    const activities = sessionIds.length > 0
      ? await this.activityRepository.find({
          where: sessionIds.map((sessionId) => ({ classSessionId: sessionId })),
          order: { createdAt: 'ASC' },
        })
      : [];
    const activityIds = activities.map((activity) => activity.id);

    const attendanceRecords = sessionIds.length > 0
      ? await this.attendanceRepository.find({
          where: sessionIds.map((sessionId) => ({ classSessionId: sessionId })),
        })
      : [];
    const signatureRecords = activityIds.length > 0
      ? await this.signatureRepository.find({
          where: activityIds.map((activityId) => ({ activityId })),
        })
      : [];
    const scoreRecords = activityIds.length > 0
      ? await this.scoreRepository.find({
          where: activityIds.map((activityId) => ({ activityId })),
        })
      : [];

    const activitiesBySession = new Map<string, ActivityEntity[]>();
    for (const activity of activities) {
      const current = activitiesBySession.get(activity.classSessionId || '') || [];
      current.push(activity);
      activitiesBySession.set(activity.classSessionId || '', current);
    }

    const attendanceMap = new Map<string, Map<string, string>>();
    for (const record of attendanceRecords) {
      const bySession = attendanceMap.get(record.classSessionId) || new Map<string, string>();
      bySession.set(record.enrollmentId, this.attendanceSymbol(record.effectiveStatus));
      attendanceMap.set(record.classSessionId, bySession);
    }

    const signatureMap = new Map<string, Map<string, number>>();
    for (const record of signatureRecords.filter((item) => !item.canceledAt)) {
      const key = `${record.activityId}`;
      const byActivity = signatureMap.get(key) || new Map<string, number>();
      byActivity.set(record.enrollmentId, (byActivity.get(record.enrollmentId) || 0) + Number(record.quantity || 0));
      signatureMap.set(key, byActivity);
    }

    const scoreMap = new Map<string, Map<string, number>>();
    for (const record of scoreRecords) {
      const key = `${record.activityId}`;
      const byActivity = scoreMap.get(key) || new Map<string, number>();
      byActivity.set(record.enrollmentId, Number(record.score));
      scoreMap.set(key, byActivity);
    }

    const sessionRows = sessions
      .filter((session) => session.status === 'CLOSED')
      .map((session) => ({
        id: session.id,
        sessionDate: session.sessionDate,
        startsAt: session.startsAt,
        status: session.status === 'CLOSED' ? 'COMPLETED' : session.status,
        partialNumber: this.computePartial(this.toDateOnly(session.sessionDate as any), course?.partial1EndsAt || null, course?.partial2EndsAt || null),
        activities: (activitiesBySession.get(session.id) || []).map((activity) => ({
          id: activity.id,
          title: activity.title,
          gradingMode: activity.gradingMode,
        })),
      }));

    const students = enrollments.map((enrollment) => {
      const fullName = enrollment.student.fullName || `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim();
      let present = 0;
      let absent = 0;
      let justified = 0;

      const rows = sessionRows.map((session) => {
        const attendance = attendanceMap.get(session.id)?.get(enrollment.id) || '';
        if (attendance === 'P') present += 1;
        if (attendance === 'A') absent += 1;
        if (attendance === 'J') justified += 1;

        return {
          sessionId: session.id,
          attendance,
          activities: session.activities.map((activity) => ({
            activityId: activity.id,
            title: activity.title,
            gradingMode: activity.gradingMode,
            value: activity.gradingMode === ActivityGradingMode.SIGNATURES
              ? (signatureMap.get(activity.id)?.get(enrollment.id) ?? null)
              : (scoreMap.get(activity.id)?.get(enrollment.id) ?? null),
          })),
        };
      });

      return {
        enrollmentId: enrollment.id,
        studentCode: enrollment.student.studentCode,
        fullName,
        totals: { present, absent, justified },
        sessions: rows,
      };
    });

    return {
      course: course
        ? {
            id: course.id,
            name: course.subject?.name || 'Curso',
            parallel: course.parallel,
          }
        : null,
      sessions: sessionRows,
      students,
    };
  }

  async getCourseExceptions(courseId: string, query: PaginationQueryDto) {
    const qb = this.exceptionRepository
      .createQueryBuilder('exception')
      .leftJoinAndSelect('exception.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('exception.course_id = :courseId', { courseId });

    if (query.search) {
      qb.andWhere(
        '(exception.reason ILIKE :search OR student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(
      `exception.${query.sortBy ?? 'requestedAt'}`,
      query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    );

    return paginateQueryBuilder(qb, query);
  }

  private attendanceSymbol(status: string | undefined): string {
    return {
      [AttendanceStatus.PRESENT]: 'P',
      [AttendanceStatus.LATE]: 'P',
      [AttendanceStatus.EARLY_LEAVE]: 'P',
      [AttendanceStatus.ABSENT]: 'A',
      [AttendanceStatus.JUSTIFIED]: 'J',
    }[status || ''] || '';
  }

  private computePartial(date: string, p1: string | Date | null, p2: string | Date | null): number {
    if (!p1 && !p2) return 1;
    const d = new Date(`${date}T12:00:00`);
    if (p1 && d <= new Date(`${this.toDateOnly(p1 as any)}T23:59:59`)) return 1;
    if (p2 && d <= new Date(`${this.toDateOnly(p2 as any)}T23:59:59`)) return 2;
    return 3;
  }

  private toDateOnly(value: string | Date) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
