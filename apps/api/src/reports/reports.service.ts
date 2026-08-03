import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecordEntity, AttendanceStatus } from '../attendance/entities/attendance-record.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPaginationMeta, paginateQueryBuilder } from '../common/utils/pagination.util';
import { EnrollmentEntity, EnrollmentStatus } from '../courses/entities/enrollment.entity';
import { ExceptionRequestEntity, ExceptionStatus } from '../exceptions/entities/exception-request.entity';
import { ClassGroupEntity } from '../groups/entities/class-group.entity';
import { ClassSessionEntity } from '../lessons/entities/class-session.entity';
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
          `COUNT(*) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.PRESENT}') AS present_count`,
          `COUNT(*) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.LATE}') AS late_count`,
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
        late: Number(attendance?.late_count ?? 0),
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
        `COUNT(DISTINCT attendance.id) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.ABSENT}') AS absences`,
        `COUNT(DISTINCT attendance.id) FILTER (WHERE attendance.effective_status = '${AttendanceStatus.LATE}') AS lates`,
        'COALESCE(SUM(signature.quantity), 0) AS signatures',
      ])
      .groupBy('enrollment.id')
      .addGroupBy('student.id');

    if (query.search) {
      baseQuery.andWhere(
        '(student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search OR student.full_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const countResult = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('COUNT(DISTINCT enrollment.id)', 'total')
      .leftJoin('enrollment.student', 'student')
      .where('enrollment.course_id = :courseId', { courseId })
      .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      .getRawOne();
    const total = Number(countResult?.total ?? 0);

    const items = await baseQuery
      .orderBy('absences', 'DESC')
      .addOrderBy('lates', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return {
      items,
      meta: buildPaginationMeta(page, pageSize, total),
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
}
