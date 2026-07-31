import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import * as QRCode from 'qrcode';
const PDFDocument = require('pdfkit');
import { AcademicPeriodEntity, PeriodStatus } from '../academic-periods/entities/academic-period.entity';
import {
  AttendanceRecordEntity,
  AttendanceStatus,
  RecordSource as AttendanceRecordSource,
} from '../attendance/entities/attendance-record.entity';
import { CourseEntity, CourseStatus } from '../courses/entities/course.entity';
import { EnrollmentEntity, EnrollmentStatus } from '../courses/entities/enrollment.entity';
import { AttachmentEntity } from '../exceptions/entities/attachment.entity';
import { ExceptionRequestEntity } from '../exceptions/entities/exception-request.entity';
import { ClassGroupEntity, GroupType } from '../groups/entities/class-group.entity';
import { GroupMembershipEntity } from '../groups/entities/group-membership.entity';
import { LessonEntity, LessonType } from '../lessons/entities/lesson.entity';
import { ClassSessionEntity, SessionStatus } from '../lessons/entities/class-session.entity';
import {
  ActivityEntity,
  ActivityGradingMode,
  ActivityStatus,
  ActivityType,
} from '../signatures/entities/activity.entity';
import { QrCredentialEntity } from '../signatures/entities/qr-credential.entity';
import { ScoreRecordEntity } from '../signatures/entities/score-record.entity';
import {
  RecordSource as SignatureRecordSource,
  SignatureRecordEntity,
} from '../signatures/entities/signature-record.entity';
import { StudentEntity } from '../students/entities/student.entity';
import { SubjectEntity } from '../subjects/entities/subject.entity';
import { CourseSpreadsheetEntity } from '../modules/google-sheets/entities/course-spreadsheet.entity';
import { SheetSyncJobEntity } from '../modules/google-sheets/entities/sheet-sync-job.entity';
import { CourseSheetSyncService } from '../modules/google-sheets/services/course-sheet-sync.service';

type ScheduleBlock = {
  weekday: number;
  weekdayLabel: string;
  startTime: string;
  endTime: string;
  label: string;
  room?: string | null;
};

type SessionNotesState = {
  baseNote: string | null;
  isAdditionalSession: boolean;
  logTopic: string;
  logContent: string;
};

@Injectable()
export class TeacherWorkflowService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AcademicPeriodEntity)
    private readonly academicPeriodRepository: Repository<AcademicPeriodEntity>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepository: Repository<AttendanceRecordEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepository: Repository<EnrollmentEntity>,
    @InjectRepository(ClassGroupEntity)
    private readonly classGroupRepository: Repository<ClassGroupEntity>,
    @InjectRepository(GroupMembershipEntity)
    private readonly groupMembershipRepository: Repository<GroupMembershipEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepository: Repository<LessonEntity>,
    @InjectRepository(ClassSessionEntity)
    private readonly sessionRepository: Repository<ClassSessionEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
    @InjectRepository(QrCredentialEntity)
    private readonly qrRepository: Repository<QrCredentialEntity>,
    @InjectRepository(ScoreRecordEntity)
    private readonly scoreRepository: Repository<ScoreRecordEntity>,
    @InjectRepository(SignatureRecordEntity)
    private readonly signatureRepository: Repository<SignatureRecordEntity>,
    @InjectRepository(StudentEntity)
    private readonly studentRepository: Repository<StudentEntity>,
    @InjectRepository(SubjectEntity)
    private readonly subjectRepository: Repository<SubjectEntity>,
    @InjectRepository(CourseSpreadsheetEntity)
    private readonly spreadsheetRepo: Repository<CourseSpreadsheetEntity>,
    @InjectRepository(SheetSyncJobEntity)
    private readonly syncJobRepo: Repository<SheetSyncJobEntity>,
    private readonly courseSheetSyncService: CourseSheetSyncService,
  ) {}

  listAcademicPeriods(userId: string, isAdmin: boolean) {
    const where = isAdmin ? {} : { createdById: userId };
    return this.academicPeriodRepository.find({
      where,
      order: { startDate: 'DESC' },
    });
  }

  createAcademicPeriod(body: Partial<AcademicPeriodEntity>, userId: string) {
    const entity = this.academicPeriodRepository.create({
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status ?? PeriodStatus.ACTIVE,
      createdById: userId,
    });
    return this.academicPeriodRepository.save(entity);
  }

  async updateAcademicPeriod(id: string, body: Partial<AcademicPeriodEntity>) {
    await this.academicPeriodRepository.update(id, body);
    return this.academicPeriodRepository.findOne({ where: { id } });
  }

  async listCourses(userId: string, isAdmin: boolean) {
    const qb = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.academicPeriod', 'academicPeriod')
      .leftJoinAndSelect('course.enrollments', 'enrollments')
      .leftJoinAndSelect('enrollments.student', 'student')
      .orderBy('course.created_at', 'DESC');

    if (!isAdmin) {
      qb.where('course.teacher_id = :userId', { userId });
    }

    const items = await qb.getMany();
    return items.map((course) => this.serializeCourse(course));
  }

  async createCourse(body: any, userId: string) {
    const subject = await this.resolveCourseSubject(body, userId);
    const entity = this.courseRepository.create({
      subjectId: subject.id,
      academicPeriodId: body.academicPeriodId,
      teacherId: body.teacherId ?? userId,
      parallel: body.parallel,
      modality: body.modality ?? 'PRESENCIAL',
      schedule: this.normalizeSchedule(body.schedule || []),
      lateToleranceMinutes: Number(body.lateToleranceMinutes ?? 10),
      status: body.status ?? CourseStatus.ACTIVE,
      partial1EndsAt: body.partial1EndsAt || null,
      partial2EndsAt: body.partial2EndsAt || null,
    });
    const saved = await this.courseRepository.save(entity);
    return this.serializeCourse(
      await this.courseRepository.findOne({
        where: { id: saved.id },
        relations: ['subject', 'academicPeriod', 'enrollments', 'enrollments.student'],
      }),
    );
  }

  async updateCourse(id: string, body: any) {
    const updateDto: Partial<CourseEntity> = {
      academicPeriodId: body.academicPeriodId,
      parallel: body.parallel,
      modality: body.modality,
      lateToleranceMinutes: body.lateToleranceMinutes,
      status: body.status,
    };

    if (body.schedule) {
      updateDto.schedule = this.normalizeSchedule(body.schedule);
    }

    if ('partial1EndsAt' in body) {
      updateDto.partial1EndsAt = body.partial1EndsAt || null;
    }
    if ('partial2EndsAt' in body) {
      updateDto.partial2EndsAt = body.partial2EndsAt || null;
    }

    if (body.name || body.displayName) {
      const course = await this.courseRepository.findOne({ where: { id }, relations: ['subject'] });
      if (!course) throw new NotFoundException('Curso no encontrado');
      await this.subjectRepository.update(course.subjectId, {
        name: body.name || body.displayName,
      });
    }

    await this.courseRepository.update(id, updateDto);
    return this.serializeCourse(
      await this.courseRepository.findOne({
        where: { id },
        relations: ['subject', 'academicPeriod', 'enrollments', 'enrollments.student'],
      }),
    );
  }

  async saveCourseSchedule(courseId: string, schedule: unknown[]) {
    const normalized = this.normalizeSchedule(schedule);
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['subject', 'academicPeriod'],
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    course.schedule = normalized;
    await this.courseRepository.save(course);
    return this.serializeCourse(course);
  }

  async removeCourse(courseId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['subject'],
    });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const sessionIds = (await this.sessionRepository.find({ where: { courseId }, select: ['id'] })).map(
      (item) => item.id,
    );
    const enrollmentRows = await this.enrollmentRepository.find({
      where: { courseId },
      select: ['id', 'studentId'],
    });
    const enrollmentIds = enrollmentRows.map((item) => item.id);
    const studentIds = [...new Set(enrollmentRows.map((item) => item.studentId))];
    const activityIds = (await this.activityRepository.find({ where: { courseId }, select: ['id'] })).map(
      (item) => item.id,
    );
    const lessonIds = (await this.lessonRepository.find({ where: { courseId }, select: ['id'] })).map(
      (item) => item.id,
    );
    const groupIds = (await this.classGroupRepository.find({ where: { courseId }, select: ['id'] })).map(
      (item) => item.id,
    );

    await this.dataSource.transaction(async (manager) => {
      const exceptionWhere: Array<Record<string, unknown>> = [{ courseId }];
      if (enrollmentIds.length > 0) {
        exceptionWhere.push({ enrollmentId: In(enrollmentIds) });
      }

      const exceptionIds = (
        await manager.find(ExceptionRequestEntity, {
          where: exceptionWhere,
          select: ['id'],
        })
      ).map((item) => item.id);

      if (exceptionIds.length > 0) {
        await manager.delete(AttachmentEntity, { exceptionRequestId: In(exceptionIds) });
        await manager.delete(ExceptionRequestEntity, { id: In(exceptionIds) });
      }

      if (activityIds.length > 0) {
        await manager.delete(SignatureRecordEntity, { activityId: In(activityIds) });
        await manager.delete(ScoreRecordEntity, { activityId: In(activityIds) });
        await manager.delete(ActivityEntity, { id: In(activityIds) });
      }

      if (sessionIds.length > 0) {
        await manager.delete(AttendanceRecordEntity, { classSessionId: In(sessionIds) });
        await manager.delete(ClassSessionEntity, { id: In(sessionIds) });
      }

      if (groupIds.length > 0) {
        await manager.delete(GroupMembershipEntity, { classGroupId: In(groupIds) });
        await manager.delete(ClassGroupEntity, { id: In(groupIds) });
      }

      if (enrollmentIds.length > 0) {
        await manager.delete(QrCredentialEntity, { enrollmentId: In(enrollmentIds) });
        await manager.delete(EnrollmentEntity, { id: In(enrollmentIds) });
      }

      if (lessonIds.length > 0) {
        await manager.delete(LessonEntity, { id: In(lessonIds) });
      }

      await manager.delete(CourseEntity, { id: courseId });

      if (studentIds.length > 0) {
        const remainingRows = await manager
          .createQueryBuilder(EnrollmentEntity, 'enrollment')
          .select('DISTINCT enrollment.student_id', 'studentId')
          .where('enrollment.student_id IN (:...studentIds)', { studentIds })
          .getRawMany<{ studentId: string }>();

        const remainingIds = new Set(remainingRows.map((item) => item.studentId));
        const orphanStudentIds = studentIds.filter((id) => !remainingIds.has(id));
        if (orphanStudentIds.length > 0) {
          await manager.delete(StudentEntity, { id: In(orphanStudentIds) });
        }
      }

      const remainingCoursesWithSubject = await manager.count(CourseEntity, {
        where: { subjectId: course.subjectId },
      });

      if (
        remainingCoursesWithSubject === 0 &&
        course.subject?.description === 'Generado automáticamente desde el flujo docente'
      ) {
        await manager.delete(SubjectEntity, { id: course.subjectId });
      }
    });

    return { id: courseId };
  }

  async registerStudent(courseId: string, body: any, userId: string) {
    const fullName = String(body.fullName || '').trim();
    if (!fullName) {
      throw new BadRequestException('fullName es obligatorio');
    }

    const student = await this.studentRepository.save(
      this.studentRepository.create(this.buildStudentPayload(fullName)),
    );

    const enrollment = await this.enrollmentRepository.save(
      this.enrollmentRepository.create({
        courseId,
        studentId: student.id,
        status: EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
      }),
    );

    const qrToken = `QR-${student.id}`;
    const credential = this.qrRepository.create({
      enrollmentId: enrollment.id,
      tokenHash: qrToken,
      createdById: userId,
    });
    await this.qrRepository.save(credential);

    return {
      enrollmentId: enrollment.id,
      qrToken,
      student: this.serializeStudent(student),
    };
  }

  async bulkRegisterStudents(courseId: string, body: { fullNames: string[] | string }, userId: string) {
    const fullNames = Array.isArray(body.fullNames)
      ? body.fullNames
      : String(body.fullNames || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean);

    const created: Array<{ enrollmentId: string; qrToken: string; student: any }> = [];
    for (const fullName of fullNames) {
      created.push(await this.registerStudent(courseId, { fullName }, userId));
    }

    return { created };
  }

  async listCourseStudents(courseId: string, page: number, search?: string, requestedPageSize?: number) {
    const pageSize = Math.max(1, Math.min(Number(requestedPageSize || 25), 200));
    const qb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('enrollment.course_id = :courseId', { courseId })
      .orderBy('enrollment.created_at', 'ASC');

    if (search?.trim()) {
      qb.andWhere(
        `(COALESCE(student.full_name, '') ILIKE :search
          OR student.first_name ILIKE :search
          OR student.last_name ILIKE :search
          OR student.student_code ILIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    const allItems = await qb.getMany();
    const sortedItems = allItems.sort((left, right) => {
      const leftName = (
        left.student.fullName ||
        `${left.student.firstName} ${left.student.lastName}`.trim()
      ).toLocaleLowerCase();
      const rightName = (
        right.student.fullName ||
        `${right.student.firstName} ${right.student.lastName}`.trim()
      ).toLocaleLowerCase();
      return leftName.localeCompare(rightName, 'es');
    });
    const total = sortedItems.length;
    const currentPage = Math.max(page, 1);
    const start = (currentPage - 1) * pageSize;
    const items = sortedItems.slice(start, start + pageSize);

    return {
      items: items.map((item) => ({
        id: item.id,
        courseId: item.courseId,
        qrToken: `QR-${item.student.id}`,
        student: this.serializeStudent(item.student),
      })),
      total,
      page: currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getCourseQrCards(courseId: string, options?: { enrollmentId?: string; search?: string }) {
    const qb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('enrollment.course_id = :courseId', { courseId })
      .orderBy('student.full_name', 'ASC', 'NULLS LAST')
      .addOrderBy('student.first_name', 'ASC');

    if (options?.enrollmentId) {
      qb.andWhere('enrollment.id = :enrollmentId', { enrollmentId: options.enrollmentId });
    }

    if (options?.search?.trim()) {
      qb.andWhere(
        `(COALESCE(student.full_name, '') ILIKE :search
          OR student.first_name ILIKE :search
          OR student.last_name ILIKE :search
          OR student.student_code ILIKE :search)`,
        { search: `%${options.search.trim()}%` },
      );
    }

    const items = await qb.getMany();
    return items.map((item) => ({
      enrollmentId: item.id,
      courseId: item.courseId,
      qrToken: `QR-${item.student.id}`,
      student: this.serializeStudent(item.student),
    }));
  }

  async generateQrPdf(courseId: string): Promise<Buffer> {
    const items = await this.getCourseQrCards(courseId);

    const COLS = 3;
    const ROWS = 4;
    const PAGE_W = 612;
    const PAGE_H = 792;
    const MARGIN = 36;
    const CELL_W = (PAGE_W - MARGIN * 2) / COLS;
    const CELL_H = (PAGE_H - MARGIN * 2) / ROWS;

    const doc = new PDFDocument({ size: 'letter', margin: 0 });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const qrSize = Math.min(CELL_W, CELL_H) * 0.6;

    for (let i = 0; i < items.length; i++) {
      const pageIndex = i % (COLS * ROWS);
      if (pageIndex === 0 && i > 0) doc.addPage();

      const col = pageIndex % COLS;
      const row = Math.floor(pageIndex / COLS) % ROWS;
      const x = MARGIN + col * CELL_W;
      const y = MARGIN + row * CELL_H;

      doc
        .lineWidth(0.5)
        .dash(3, { space: 3 })
        .rect(x + 2, y + 2, CELL_W - 4, CELL_H - 4)
        .stroke('#aaa');
      doc.undash();

      const qrDataUrl = await QRCode.toDataURL(items[i].qrToken, {
        margin: 1,
        width: Math.floor(qrSize),
      });

      const qrImgX = x + (CELL_W - qrSize) / 2;
      const qrImgY = y + 12;
      doc.image(qrDataUrl, qrImgX, qrImgY, { width: qrSize });

      const name = items[i].student.fullName || `${items[i].student.firstName} ${items[i].student.lastName}`;
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor('#000')
        .text(name.trim(), x + 2, y + qrSize + 18, {
          width: CELL_W - 4,
          align: 'center',
          lineBreak: true,
        });
    }

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async listCourseGroups(courseId: string) {
    const groups = await this.classGroupRepository.find({
      where: { courseId, active: true },
      relations: ['memberships'],
      order: { createdAt: 'ASC' },
    });
    return groups.map((group) => ({
      ...group,
      schedule: this.normalizeSchedule(group.schedule || []),
      members: group.memberships?.length || 0,
      enrollmentIds: group.memberships?.map((membership) => membership.enrollmentId) || [],
    }));
  }

  async createCourseGroup(courseId: string, body: any, userId: string) {
    const group = await this.classGroupRepository.save(
      this.classGroupRepository.create({
        courseId,
        name: body.name,
        code: body.code || this.buildSubjectCode(body.name).slice(0, 12),
        type: body.type || GroupType.CUSTOM,
        schedule: this.normalizeSchedule(body.schedule || []),
        active: true,
      }),
    );

    const enrollmentIds: string[] = Array.isArray(body.enrollmentIds) ? body.enrollmentIds : [];
    if (enrollmentIds.length > 0) {
      for (const enrollmentId of enrollmentIds) {
        await this.groupMembershipRepository.save(
          this.groupMembershipRepository.create({
            classGroupId: group.id,
            enrollmentId,
            assignedAt: new Date(),
            assignedById: userId,
          }),
        );
      }
    }

    return {
      ...group,
      schedule: this.normalizeSchedule(group.schedule || []),
      members: enrollmentIds.length,
    };
  }

  async updateCourseGroup(courseId: string, groupId: string, body: any) {
    const group = await this.classGroupRepository.findOne({
      where: { id: groupId, courseId },
      relations: ['memberships'],
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    group.name = body.name ?? group.name;
    group.code = body.code ?? group.code;
    if (body.schedule) {
      group.schedule = this.normalizeSchedule(body.schedule);
    }

    const saved = await this.classGroupRepository.save(group);
    return {
      ...saved,
      schedule: this.normalizeSchedule(saved.schedule || []),
      members: group.memberships?.length || 0,
      enrollmentIds: group.memberships?.map((membership) => membership.enrollmentId) || [],
    };
  }

  async removeCourseGroup(courseId: string, groupId: string) {
    const group = await this.classGroupRepository.findOne({
      where: { id: groupId, courseId },
      relations: ['memberships'],
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    if (group.memberships?.length) {
      await this.groupMembershipRepository.delete({ classGroupId: groupId });
    }

    const sessions = await this.sessionRepository.find({
      where: { courseId, classGroupId: groupId, status: SessionStatus.PLANNED },
    });
    if (sessions.length > 0) {
      await this.sessionRepository.delete(sessions.map((item) => item.id));
    }

    await this.classGroupRepository.delete(groupId);
    return { id: groupId };
  }

  async replaceGroupMembers(courseId: string, groupId: string, enrollmentIds: string[], userId: string) {
    const group = await this.classGroupRepository.findOne({
      where: { id: groupId, courseId },
      relations: ['memberships'],
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    await this.groupMembershipRepository.delete({ classGroupId: groupId });

    for (const enrollmentId of enrollmentIds) {
      await this.groupMembershipRepository.save(
        this.groupMembershipRepository.create({
          classGroupId: groupId,
          enrollmentId,
          assignedAt: new Date(),
          assignedById: userId,
        }),
      );
    }

    return this.listCourseGroups(courseId);
  }

  async createAdditionalSession(courseId: string, body: any, userId: string) {
    const lesson = await this.ensureOperationalLesson(courseId, userId);
    const startsAt = new Date(body.startsAt);
    const endsAt = body.endsAt ? new Date(body.endsAt) : undefined;
    const sessionDate = this.toDateOnly(body.sessionDate ? this.normalizeDate(body.sessionDate) : startsAt);
    const session = this.sessionRepository.create({
      lessonId: lesson.id,
      courseId,
      sessionDate: sessionDate as unknown as Date,
      startsAt,
      endsAt,
      notes: this.stringifySessionNotes({
        baseNote: String(body.notes || '').trim() || 'Sesión adicional',
        isAdditionalSession: true,
        logTopic: '',
        logContent: '',
      }) as any,
      topicTaught: body.topicTaught || body.label || 'Sesión adicional',
      classGroupId: body.classGroupId || undefined,
      status: SessionStatus.PLANNED,
      createdById: userId,
      partialOverride: body.partialOverride || null,
    });
    const saved = await this.sessionRepository.save(session);
    return this.serializeSession(saved);
  }

  async listAdditionalSessions(courseId: string, page: number, search?: string) {
    const pageSize = 10;
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.classGroup', 'classGroup')
      .where('session.course_id = :courseId', { courseId })
      .andWhere('session.notes LIKE :marker', { marker: 'ADDITIONAL_SESSION|%' })
      .orderBy('session.starts_at', 'DESC');

    if (search?.trim()) {
      qb.andWhere(
        `(COALESCE(session.topic_taught, '') ILIKE :search OR COALESCE(classGroup.name, '') ILIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    const allItems = await qb.getMany();
    const total = allItems.length;
    const currentPage = Math.max(page, 1);
    const start = (currentPage - 1) * pageSize;
    const items = allItems.slice(start, start + pageSize);

    return {
      items: items.map((item) => this.serializeSession(item)),
      total,
      page: currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateAdditionalSession(sessionId: string, body: any) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Sesión no encontrada.');
    if (body.startsAt) session.startsAt = new Date(body.startsAt);
    if (body.endsAt) session.endsAt = new Date(body.endsAt);
    if (body.topicTaught !== undefined) session.topicTaught = body.topicTaught;
    if (body.sessionDate) {
      session.sessionDate = this.toDateOnly(this.normalizeDate(body.sessionDate)) as unknown as Date;
    }
    if (body.notes !== undefined) {
      const parsedNotes = this.parseSessionNotes(session.notes);
      parsedNotes.baseNote = String(body.notes || '').trim() || null;
      session.notes = this.stringifySessionNotes(parsedNotes) as any;
    }
    const saved = await this.sessionRepository.save(session);
    return this.serializeSession(saved);
  }

  async deleteAdditionalSession(sessionId: string) {
    await this.sessionRepository.delete(sessionId);
  }

  async getDailyAgenda(userId: string, date?: string) {
    const targetDate = this.normalizeDate(date);
    await this.materializeTeacherSchedule(userId, targetDate);

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.academicPeriod', 'academicPeriod')
      .leftJoinAndSelect('session.classGroup', 'classGroup')
      .where('course.teacher_id = :userId', { userId })
      .andWhere('session.session_date = :sessionDate', { sessionDate: this.toDateOnly(targetDate) })
      .orderBy('session.starts_at', 'ASC')
      .getMany();

    const attendanceMap = await this.getAttendanceStatusMap(sessions.map((session) => session.id));
    const serialized = sessions
      .map((session) => this.serializeSession(session, true))
      .map((session) => ({
        ...session,
        attendanceTaken: attendanceMap[session.id] || false,
      }))
      .filter((session) => this.isSessionVisible(session, targetDate));
    const openSession = serialized.find((session) => session.status === 'OPEN') || null;

    return {
      date: this.toDateOnly(targetDate),
      openSession,
      nextSession: this.findNextSession(serialized, targetDate, openSession?.id),
      sessions: serialized,
    };
  }

  async getWeeklyAgenda(userId: string, date?: string) {
    const anchorDate = this.normalizeDate(date);
    const weekStart = this.dateOnlyValue(anchorDate);
    const weekDates = Array.from({ length: 6 }, (_, index) => this.addDays(weekStart, index));

    for (const currentDate of weekDates) {
      await this.materializeTeacherSchedule(userId, currentDate);
    }

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.academicPeriod', 'academicPeriod')
      .leftJoinAndSelect('session.classGroup', 'classGroup')
      .where('course.teacher_id = :userId', { userId })
      .andWhere('session.session_date BETWEEN :from AND :to', {
        from: this.toDateOnly(weekStart),
        to: this.toDateOnly(this.addDays(weekStart, 5)),
      })
      .orderBy('session.session_date', 'ASC')
      .addOrderBy('session.starts_at', 'ASC')
      .getMany();

    const attendanceMap = await this.getAttendanceStatusMap(sessions.map((session) => session.id));
    const serialized = sessions
      .map((session) => this.serializeSession(session, true))
      .map((session) => ({
        ...session,
        attendanceTaken: attendanceMap[session.id] || false,
      }));
    const openSession = serialized.find((session) => session.status === 'OPEN') || null;

    return {
      weekStart: this.toDateOnly(weekStart),
      weekEnd: this.toDateOnly(this.addDays(weekStart, 5)),
      openSession,
      nextSession: this.findNextSession(serialized, anchorDate, openSession?.id),
      days: weekDates.map((currentDate) => ({
        date: this.toDateOnly(currentDate),
        sessions: serialized.filter((session) => session.sessionDate === this.toDateOnly(currentDate)),
      })),
    };
  }

  async getCurrentSession(userId: string) {
    const session = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.academicPeriod', 'academicPeriod')
      .leftJoinAndSelect('session.classGroup', 'classGroup')
      .where('course.teacher_id = :userId', { userId })
      .andWhere('session.status = :status', { status: SessionStatus.OPEN })
      .orderBy('session.opened_at', 'DESC')
      .getOne();

    if (!session) return null;
    return this.serializeSession(session, true);
  }

  async openSession(sessionId: string, userId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.status === SessionStatus.CLOSED) {
      throw new ConflictException('La sesión ya fue completada');
    }

    const conflict = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.course_id = :courseId', { courseId: session.courseId })
      .andWhere('session.session_date = :sessionDate', { sessionDate: this.coerceDateOnly(session.sessionDate) })
      .andWhere('session.status = :status', { status: SessionStatus.OPEN })
      .andWhere('session.id <> :sessionId', { sessionId })
      .getOne();

    if (conflict) {
      throw new ConflictException('Ya existe una clase abierta para este bloque');
    }

    session.status = SessionStatus.OPEN;
    session.openedAt = new Date();
    session.createdById = session.createdById || userId;
    const savedSession = await this.sessionRepository.save(session);

    const draftActivities = await this.activityRepository.find({
      where: { classSessionId: sessionId, status: ActivityStatus.DRAFT },
    });
    if (draftActivities.length > 0) {
      for (const activity of draftActivities) {
        activity.status = ActivityStatus.OPEN;
      }
      await this.activityRepository.save(draftActivities);
    }

    return this.serializeSession(savedSession);
  }

  async getSessionRoster(sessionId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const enrollments = session.classGroupId
      ? (
          await this.groupMembershipRepository.find({
            where: { classGroupId: session.classGroupId, removedAt: IsNull() },
            relations: ['enrollment', 'enrollment.student'],
            order: { createdAt: 'ASC' },
          })
        ).map((membership) => membership.enrollment)
      : await this.enrollmentRepository.find({
          where: { courseId: session.courseId, status: EnrollmentStatus.ACTIVE },
          relations: ['student'],
          order: { createdAt: 'ASC' },
        });
    const records = await this.attendanceRepository.find({
      where: { classSessionId: sessionId },
      order: { createdAt: 'ASC' },
    });

    return {
      session: this.serializeSession(session),
      items: enrollments.map((enrollment, index) => {
        const record = records.find((item) => item.enrollmentId === enrollment.id);
        return {
          order: index + 1,
          enrollmentId: enrollment.id,
          attendanceRecordId: record?.id || null,
          fullName: enrollment.student.fullName || `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim(),
          studentCode: enrollment.student.studentCode,
          qrToken: `QR-${enrollment.student.id}`,
          status: record?.effectiveStatus || null,
          justification: record?.comment || '',
        };
      }),
    };
  }

  async getSessionDetail(sessionId: string) {
    const session = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.course', 'course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.academicPeriod', 'academicPeriod')
      .leftJoinAndSelect('session.classGroup', 'classGroup')
      .where('session.id = :sessionId', { sessionId })
      .getOne();

    if (!session) throw new NotFoundException('Sesión no encontrada');

    const serializedSession = this.serializeSession(session, true);
    const activities = await this.listSessionActivities(sessionId);
    const roster = await this.getSessionRoster(sessionId);
    const activityBoard = await this.getSessionActivityBoard(sessionId, roster.items, activities);
    const attendanceTaken = roster.items.some((item) => item.status !== null);

    return {
      session: {
        ...serializedSession,
        attendanceTaken,
      },
      activities,
      roster,
      activityBoard,
    };
  }

  async registerAttendance(sessionId: string, body: any, userId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.status !== SessionStatus.OPEN) {
      throw new ConflictException('La sesión no está abierta');
    }

    const status = body.status as AttendanceStatus;
    if (!Object.values(AttendanceStatus).includes(status)) {
      throw new BadRequestException('Estado de asistencia inválido');
    }

    let record = await this.attendanceRepository.findOne({
      where: { classSessionId: sessionId, enrollmentId: body.enrollmentId },
    });

    if (!record) {
      record = this.attendanceRepository.create({
        classSessionId: sessionId,
        enrollmentId: body.enrollmentId,
        originalStatus: status,
        effectiveStatus: status,
        comment: body.justification || null,
        source: body.source || AttendanceRecordSource.MANUAL,
        registeredById: userId,
      });
    } else {
      record.originalStatus = status;
      record.effectiveStatus = status;
      record.comment = body.justification || null;
    }

    const saved = await this.attendanceRepository.save(record);
    return {
      id: saved.id,
      enrollmentId: saved.enrollmentId,
      status: saved.effectiveStatus,
      justification: saved.comment || '',
    };
  }

  async completeSession(sessionId: string, body: any, userId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.status !== SessionStatus.OPEN) {
      throw new ConflictException('Solo se puede completar una sesión abierta');
    }

    session.status = SessionStatus.CLOSED;
    session.closedAt = new Date();
    const parsedNotes = this.parseSessionNotes(session.notes);
    if (body.logTopic !== undefined) {
      parsedNotes.logTopic = String(body.logTopic || '').trim();
    } else if (body.topicTaught !== undefined) {
      parsedNotes.logTopic = String(body.topicTaught || '').trim();
    }
    if (body.logContent !== undefined) {
      parsedNotes.logContent = String(body.logContent || '').trim();
    } else if (body.notes !== undefined) {
      parsedNotes.logContent = String(body.notes || '').trim();
    }
    session.topicTaught = parsedNotes.logTopic || '';
    session.notes = this.stringifySessionNotes(parsedNotes) as any;
    session.createdById = session.createdById || userId;

    const activities = await this.activityRepository.find({
      where: { classSessionId: sessionId, status: ActivityStatus.OPEN },
    });
    for (const activity of activities) {
      activity.status = ActivityStatus.CLOSED;
    }
    if (activities.length > 0) {
      await this.activityRepository.save(activities);
    }

    const saved = await this.sessionRepository.save(session);
    const result = this.serializeSession(saved);

    const spreadsheet = await this.spreadsheetRepo.findOne({ where: { courseId: session.courseId } });
    if (spreadsheet?.spreadsheetId) {
      const job = this.syncJobRepo.create({
        courseId: session.courseId,
        classId: session.id,
        reason: 'CLASS_CLOSED',
        status: 'PENDING',
      });
      await this.syncJobRepo.save(job);

      this.courseSheetSyncService.syncCourseSheet(session.courseId, job.id).catch(() => {});
    }

    return result;
  }

  async updateSessionLog(sessionId: string, body: { logTopic?: string; logContent?: string; topicTaught?: string; notes?: string }) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const parsedNotes = this.parseSessionNotes(session.notes);
    const topic = body.logTopic ?? body.topicTaught;
    const content = body.logContent ?? body.notes;

    if (topic !== undefined) {
      parsedNotes.logTopic = String(topic || '').trim();
      session.topicTaught = parsedNotes.logTopic || '';
    }
    if (content !== undefined) {
      parsedNotes.logContent = String(content || '').trim();
    }
    session.notes = this.stringifySessionNotes(parsedNotes) as any;

    return this.serializeSession(await this.sessionRepository.save(session));
  }

  async updateSessionPartial(sessionId: string, partialNumber: number) {
    if (!Number.isInteger(partialNumber) || partialNumber < 1 || partialNumber > 3) {
      throw new BadRequestException('El parcial debe ser 1, 2 o 3');
    }
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course', 'classGroup'],
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    session.partialOverride = partialNumber;
    return this.serializeSession(await this.sessionRepository.save(session));
  }

  async listSessionActivities(sessionId: string) {
    const items = await this.activityRepository.find({
      where: { classSessionId: sessionId },
      order: { createdAt: 'DESC' },
    });

    return items.map((item) => this.serializeActivity(item));
  }

  async createActivity(sessionId: string, body: any, userId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (![SessionStatus.OPEN, SessionStatus.PLANNED].includes(session.status)) {
      throw new ConflictException('Solo se pueden preparar actividades para sesiones tentativas o abiertas');
    }

    const gradingMode = body.gradingMode as ActivityGradingMode;
    if (!Object.values(ActivityGradingMode).includes(gradingMode)) {
      throw new BadRequestException('gradingMode inválido');
    }

    const activity = this.activityRepository.create({
      courseId: session.courseId,
      lessonId: session.lessonId,
      classSessionId: sessionId,
      title: body.title,
      type: body.type || ActivityType.OTHER,
      gradingMode,
      activityDate: session.sessionDate,
      maxSignatures: Number(body.maxSignatures ?? 1),
      signatureValue: Number(body.signatureValue ?? 1),
      status: body.status || (session.status === SessionStatus.OPEN ? ActivityStatus.OPEN : ActivityStatus.DRAFT),
      notes: body.notes || null,
      createdById: userId,
    });

    return this.serializeActivity(await this.activityRepository.save(activity));
  }

  async updateActivity(activityId: string, body: any) {
    const existing = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!existing) throw new NotFoundException('Actividad no encontrada');
    if (body.gradingMode && !Object.values(ActivityGradingMode).includes(body.gradingMode)) {
      throw new BadRequestException('gradingMode inválido');
    }
    if (body.maxSignatures !== undefined) {
      body.maxSignatures = Math.max(1, Number(body.maxSignatures));
    }
    await this.activityRepository.update(activityId, body);
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return this.serializeActivity(activity);
  }

  async deleteActivity(activityId: string) {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    await this.activityRepository.delete(activityId);
    return { success: true };
  }

  async scanActivity(activityId: string, body: any, userId: string) {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada');
    if (activity.status !== ActivityStatus.OPEN) {
      throw new ConflictException('La actividad ya está cerrada');
    }

    const session = await this.sessionRepository.findOne({ where: { id: activity.classSessionId || undefined } });
    if (!session || session.status !== SessionStatus.OPEN) {
      throw new ConflictException('La clase debe estar abierta para registrar QR');
    }

    let enrollment: EnrollmentEntity | null = null;

    if (body.enrollmentId) {
      enrollment = await this.enrollmentRepository.findOne({
        where: { id: body.enrollmentId },
        relations: ['student'],
      });
      if (!enrollment) {
        throw new NotFoundException('Estudiante no encontrado');
      }
    } else {
      const credential = await this.qrRepository.findOne({
        where: { tokenHash: body.token },
        relations: ['enrollment', 'enrollment.student'],
      });
      if (!credential?.enrollment) {
        throw new NotFoundException('QR no válido');
      }
      enrollment = credential.enrollment;
    }

    if (enrollment.courseId !== activity.courseId) {
      throw new ConflictException('El QR no corresponde a este curso');
    }

    if (activity.gradingMode === ActivityGradingMode.SIGNATURES) {
      const currentCount = await this.signatureRepository
        .createQueryBuilder('sr')
        .select('COALESCE(SUM(sr.quantity), 0)', 'total')
        .where('sr.activity_id = :activityId', { activityId: activity.id })
        .andWhere('sr.enrollment_id = :enrollmentId', { enrollmentId: enrollment.id })
        .andWhere('sr.canceled_at IS NULL')
        .getRawOne<{ total: string }>();

      const total = Number(currentCount?.total ?? 0);
      const quantity = Number(body.quantity ?? 1);

      if (total + quantity > activity.maxSignatures) {
        throw new ConflictException(
          `El estudiante ya tiene ${total} firma(s) de ${activity.maxSignatures} permitida(s)`,
        );
      }

      const record = this.signatureRepository.create({
        activityId: activity.id,
        enrollmentId: enrollment.id,
        classSessionId: activity.classSessionId || undefined,
        quantity,
        source: SignatureRecordSource.QR,
        registeredById: userId,
        comment: body.comment || null,
        registeredAt: new Date(),
      });

      try {
        await this.signatureRepository.save(record);
      } catch (error: any) {
        if (error?.message?.includes('excede el máximo')) {
          throw new ConflictException(`El estudiante ya alcanzó el máximo de ${activity.maxSignatures} firma(s)`);
        }
        throw error;
      }
    } else {
      const numericScore = Number(body.score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new BadRequestException('La nota debe estar entre 0 y 100');
      }
      let scoreRecord = await this.scoreRepository.findOne({
        where: { activityId: activity.id, enrollmentId: enrollment.id },
      });
      if (!scoreRecord) {
        scoreRecord = this.scoreRepository.create({
          activityId: activity.id,
          enrollmentId: enrollment.id,
          classSessionId: activity.classSessionId,
          registeredById: userId,
          score: numericScore,
          comment: body.comment || null,
        });
      } else {
        scoreRecord.score = numericScore;
        scoreRecord.comment = body.comment || null;
      }
      await this.scoreRepository.save(scoreRecord);
    }

    return {
      activity: this.serializeActivity(activity),
      student: this.serializeStudent(enrollment.student),
    };
  }

  private async resolveCourseSubject(body: any, userId: string) {
    if (body.subjectId) {
      const subject = await this.subjectRepository.findOne({ where: { id: body.subjectId } });
      if (subject) return subject;
    }

    const baseName = String(body.name || body.displayName || '').trim();
    if (!baseName) {
      throw new BadRequestException('name es obligatorio para crear el curso');
    }

    const subject = this.subjectRepository.create({
      name: baseName,
      code: this.buildSubjectCode(baseName),
      active: true,
      createdById: userId,
      description: 'Generado automáticamente desde el flujo docente',
    });
    return this.subjectRepository.save(subject);
  }

  private async ensureOperationalLesson(courseId: string, userId: string) {
    let lesson = await this.lessonRepository.findOne({
      where: { courseId, title: 'Clase operativa' },
      order: { createdAt: 'ASC' },
    });

    if (!lesson) {
      lesson = await this.lessonRepository.save(
        this.lessonRepository.create({
          courseId,
          title: 'Clase operativa',
          type: LessonType.OTHER,
          plannedTopic: 'Contenedor operativo para agenda y sesiones reales',
          sequenceNumber: 1,
          createdById: userId,
        }),
      );
    }

    return lesson;
  }

  private async materializeTeacherSchedule(userId: string, date: Date) {
    const courses = await this.courseRepository.find({
      where: { teacherId: userId },
    });

    for (const course of courses) {
      await this.materializeCourseSchedule(course, date, userId);
    }
  }

  private async materializeCourseSchedule(course: CourseEntity, date: Date, userId: string) {
    const blocks = this.normalizeSchedule(course.schedule || []);
    if (blocks.length === 0) return;
    const weekday = date.getDay();
    const lesson = await this.ensureOperationalLesson(course.id, userId);
    const sessionDate = this.toDateOnly(date);
    const targetBlocks = blocks.filter((block) => block.weekday === weekday);

    for (const block of targetBlocks) {
      const startsAt = this.mergeDateAndTime(date, block.startTime);
      const existing = await this.sessionRepository.findOne({
        where: {
          courseId: course.id,
          sessionDate: sessionDate as unknown as Date,
          startsAt,
        },
      });
      if (existing) continue;

      await this.sessionRepository.save(
        this.sessionRepository.create({
          lessonId: lesson.id,
          courseId: course.id,
          sessionDate: sessionDate as unknown as Date,
          startsAt,
          endsAt: this.mergeDateAndTime(date, block.endTime),
          status: SessionStatus.PLANNED,
          topicTaught: block.label,
          notes: block.room || undefined,
          createdById: userId,
        }),
      );
    }

    const groups = await this.classGroupRepository.find({
      where: { courseId: course.id, active: true },
    });

    for (const group of groups) {
      const groupBlocks = this.normalizeSchedule(group.schedule || []).filter((block) => block.weekday === weekday);
      for (const block of groupBlocks) {
        const startsAt = this.mergeDateAndTime(date, block.startTime);
        const existing = await this.sessionRepository.findOne({
          where: {
            courseId: course.id,
            classGroupId: group.id,
            sessionDate: sessionDate as unknown as Date,
            startsAt,
          },
        });
        if (existing) continue;

        await this.sessionRepository.save(
          this.sessionRepository.create({
            lessonId: lesson.id,
            courseId: course.id,
            classGroupId: group.id,
            sessionDate: sessionDate as unknown as Date,
            startsAt,
            endsAt: this.mergeDateAndTime(date, block.endTime),
            status: SessionStatus.PLANNED,
            topicTaught: `${block.label} · ${group.name}`,
            notes: block.room || undefined,
            createdById: userId,
          }),
        );
      }
    }
  }

  private normalizeSchedule(input: unknown[]): ScheduleBlock[] {
    return (input || [])
      .map((item: any) => ({
        weekday: Number(item.weekday ?? this.weekdayLabelToNumber(item.weekdayLabel ?? item.day ?? item.weekdayName)),
        weekdayLabel: String(item.weekdayLabel ?? this.weekdayNumberToLabel(Number(item.weekday ?? 0))),
        startTime: String(item.startTime ?? item.start ?? '08:00'),
        endTime: String(item.endTime ?? item.end ?? '09:00'),
        label: String(item.label ?? item.title ?? 'Bloque de clase'),
        room: item.room || null,
      }))
      .filter((item) => Number.isInteger(item.weekday) && item.weekday >= 0 && item.weekday <= 6);
  }

  private serializeCourse(course: CourseEntity | null) {
    if (!course) return null;
    return {
      ...course,
      name: course.subject?.name || 'Curso',
      displayName: course.subject?.name || 'Curso',
      partial1EndsAt: course.partial1EndsAt || null,
      partial2EndsAt: course.partial2EndsAt || null,
      schedule: this.normalizeSchedule(course.schedule || []),
      enrollments: course.enrollments?.map((enrollment) => ({
        ...enrollment,
        student: enrollment.student ? this.serializeStudent(enrollment.student) : undefined,
      })),
    };
  }

  private serializeSession(session: ClassSessionEntity, includeCourse = false) {
    const parsedNotes = this.parseSessionNotes(session.notes);
    const normalizedSessionDate = this.coerceDateOnly(session.sessionDate);
    const course = (session as any).course as CourseEntity | undefined;

    let partialNumber: number;
    if (session.partialOverride) {
      partialNumber = session.partialOverride;
    } else {
      const p1Ends = course?.partial1EndsAt ? new Date(`${course.partial1EndsAt}T23:59:59`) : null;
      const p2Ends = course?.partial2EndsAt ? new Date(`${course.partial2EndsAt}T23:59:59`) : null;
      const date = new Date(`${normalizedSessionDate}T12:00:00`);

      if (!p1Ends && !p2Ends) {
        partialNumber = 1;
      } else if (p1Ends && date <= p1Ends) {
        partialNumber = 1;
      } else if (p2Ends && date <= p2Ends) {
        partialNumber = 2;
      } else {
        partialNumber = 3;
      }
    }

    return {
      ...session,
      sessionDate: normalizedSessionDate,
      status: session.status === SessionStatus.CLOSED ? 'COMPLETED' : session.status,
      topicTaught: session.topicTaught || parsedNotes.logTopic || null,
      partialNumber,
      classGroup: (session as any).classGroup
        ? {
            id: (session as any).classGroup.id,
            name: (session as any).classGroup.name,
            code: (session as any).classGroup.code,
          }
        : undefined,
      notes: parsedNotes.baseNote,
      logTopic: parsedNotes.logTopic,
      logContent: parsedNotes.logContent,
      course: includeCourse ? this.serializeCourse(course || null) : undefined,
    };
  }

  private serializeActivity(activity: ActivityEntity) {
    return {
      ...activity,
      gradingMode: activity.gradingMode,
    };
  }

  private serializeStudent(student: StudentEntity) {
    const fullName = student.fullName || `${student.firstName} ${student.lastName}`.trim();
    return {
      id: student.id,
      fullName,
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      active: student.active,
    };
  }

  private buildStudentPayload(fullName: string): Partial<StudentEntity> {
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || fullName;
    const lastName = parts.slice(1).join(' ') || '.';
    return {
      fullName,
      firstName,
      lastName,
      studentCode: `ALU-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      active: true,
    };
  }

  private buildSubjectCode(name: string) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 32)
      .toUpperCase();
  }

  private parseSessionNotes(rawNotes?: string | null): SessionNotesState {
    if (!rawNotes) {
      return {
        baseNote: null,
        isAdditionalSession: false,
        logTopic: '',
        logContent: '',
      };
    }

    if (rawNotes.startsWith('SESSION_META|')) {
      try {
        const parsed = JSON.parse(rawNotes.slice('SESSION_META|'.length));
        return {
          baseNote: parsed.baseNote || null,
          isAdditionalSession: parsed.isAdditionalSession === true,
          logTopic: String(parsed.logTopic || ''),
          logContent: String(parsed.logContent || ''),
        };
      } catch {
        return {
          baseNote: rawNotes,
          isAdditionalSession: false,
          logTopic: '',
          logContent: '',
        };
      }
    }

    if (rawNotes.startsWith('ADDITIONAL_SESSION|')) {
      return {
        baseNote: rawNotes.slice('ADDITIONAL_SESSION|'.length) || null,
        isAdditionalSession: true,
        logTopic: '',
        logContent: '',
      };
    }

    return {
      baseNote: rawNotes,
      isAdditionalSession: false,
      logTopic: '',
      logContent: '',
    };
  }

  private stringifySessionNotes(state: SessionNotesState) {
    const hasBase = Boolean(state.baseNote && state.baseNote.trim());
    const hasLogTopic = Boolean(state.logTopic.trim());
    const hasLogContent = Boolean(state.logContent.trim());

    if (!hasBase && !hasLogTopic && !hasLogContent && !state.isAdditionalSession) {
      return null;
    }

    return `SESSION_META|${JSON.stringify({
      baseNote: hasBase ? state.baseNote : null,
      isAdditionalSession: state.isAdditionalSession,
      logTopic: state.logTopic.trim(),
      logContent: state.logContent.trim(),
    })}`;
  }

  private normalizeDate(date?: string) {
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    return new Date();
  }

  private toDateOnly(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mergeDateAndTime(date: Date, time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
  }

  private dateOnlyValue(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private startOfWeek(date: Date) {
    const value = this.dateOnlyValue(date);
    const weekday = value.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    value.setDate(value.getDate() + offset);
    return value;
  }

  private addDays(date: Date, amount: number) {
    const value = this.dateOnlyValue(date);
    value.setDate(value.getDate() + amount);
    return value;
  }

  private findNextSession(
    sessions: Array<any>,
    fromDate: Date,
    skipSessionId?: string,
  ) {
    const currentTime = fromDate.getTime();
    const next = sessions
      .filter((session) => session.id !== skipSessionId)
      .find((session) => new Date(session.startsAt).getTime() >= currentTime && session.status !== 'COMPLETED');
    return next || null;
  }

  private isSessionVisible(session: { startsAt: string | Date; status: string }, anchorDate: Date) {
    if (session.status === 'OPEN') return true;
    return new Date(session.startsAt).getTime() >= anchorDate.getTime();
  }

  private coerceDateOnly(value: string | Date) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    return this.toDateOnly(new Date(value));
  }

  private async getAttendanceStatusMap(sessionIds: string[]) {
    if (sessionIds.length === 0) return {} as Record<string, boolean>;
    const rows = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.class_session_id', 'sessionId')
      .addSelect('COUNT(attendance.id)', 'count')
      .where('attendance.class_session_id IN (:...sessionIds)', { sessionIds })
      .groupBy('attendance.class_session_id')
      .getRawMany<{ sessionId: string; count: string }>();

    return rows.reduce(
      (acc, row) => {
        acc[row.sessionId] = Number(row.count) > 0;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  private async getSessionActivityBoard(sessionId: string, rosterItems: any[], activities: any[]) {
    const signatureRows = await this.signatureRepository
      .createQueryBuilder('signature')
      .select('signature.activity_id', 'activityId')
      .addSelect('signature.enrollment_id', 'enrollmentId')
      .addSelect('COALESCE(SUM(signature.quantity), 0)', 'total')
      .where('signature.class_session_id = :sessionId', { sessionId })
      .groupBy('signature.activity_id')
      .addGroupBy('signature.enrollment_id')
      .getRawMany<{ activityId: string; enrollmentId: string; total: string }>();

    const scoreRows = await this.scoreRepository
      .createQueryBuilder('score')
      .select('score.activity_id', 'activityId')
      .addSelect('score.enrollment_id', 'enrollmentId')
      .addSelect('score.score', 'score')
      .where('score.class_session_id = :sessionId', { sessionId })
      .getRawMany<{ activityId: string; enrollmentId: string; score: string }>();

    return rosterItems.map((item) => ({
      enrollmentId: item.enrollmentId,
      fullName: item.fullName,
      studentCode: item.studentCode,
      attendanceStatus: item.status,
      activities: activities.map((activity) => {
        if (activity.gradingMode === 'SIGNATURES') {
          const match = signatureRows.find(
            (row) => row.activityId === activity.id && row.enrollmentId === item.enrollmentId,
          );
          return {
            activityId: activity.id,
            title: activity.title,
            gradingMode: activity.gradingMode,
            value: match ? Number(match.total) : 0,
          };
        }

        const match = scoreRows.find(
          (row) => row.activityId === activity.id && row.enrollmentId === item.enrollmentId,
        );
        return {
          activityId: activity.id,
          title: activity.title,
          gradingMode: activity.gradingMode,
          value: match ? Number(match.score) : null,
        };
      }),
    }));
  }

  private weekdayLabelToNumber(label: string) {
    const normalized = String(label || '')
      .trim()
      .toLowerCase();
    return (
      {
        domingo: 0,
        lunes: 1,
        martes: 2,
        miercoles: 3,
        'miércoles': 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
        sábado: 6,
      }[normalized] ?? -1
    );
  }

  private weekdayNumberToLabel(weekday: number) {
    return ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][weekday] || 'lunes';
  }
}
