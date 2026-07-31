import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { sheets_v4 } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';
import { CourseSpreadsheetEntity } from '../entities/course-spreadsheet.entity';
import { SheetSyncJobEntity } from '../entities/sheet-sync-job.entity';
import { EnrollmentEntity } from '../../../courses/entities/enrollment.entity';
import { ClassSessionEntity, SessionStatus } from '../../../lessons/entities/class-session.entity';
import { ActivityEntity } from '../../../signatures/entities/activity.entity';
import { SignatureRecordEntity } from '../../../signatures/entities/signature-record.entity';
import { ScoreRecordEntity } from '../../../signatures/entities/score-record.entity';
import { AttendanceRecordEntity } from '../../../attendance/entities/attendance-record.entity';
import { CourseEntity } from '../../../courses/entities/course.entity';
import { HEADER_BG, HEADER_FG, tabNames, COURSE_SHEET_TEMPLATE_VERSION, sheetTemplate } from './spreadsheet-template.service';

@Injectable()
export class CourseSheetSyncService {
  private readonly logger = new Logger(CourseSheetSyncService.name);

  constructor(
    @InjectRepository(CourseSpreadsheetEntity)
    private readonly spreadsheetRepo: Repository<CourseSpreadsheetEntity>,
    @InjectRepository(SheetSyncJobEntity)
    private readonly jobRepo: Repository<SheetSyncJobEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentRepo: Repository<EnrollmentEntity>,
    @InjectRepository(ClassSessionEntity)
    private readonly sessionRepo: Repository<ClassSessionEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
    @InjectRepository(SignatureRecordEntity)
    private readonly signatureRepo: Repository<SignatureRecordEntity>,
    @InjectRepository(ScoreRecordEntity)
    private readonly scoreRepo: Repository<ScoreRecordEntity>,
    @InjectRepository(AttendanceRecordEntity)
    private readonly attendanceRepo: Repository<AttendanceRecordEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    private readonly authService: GoogleAuthService,
  ) {}

  async syncCourseSheet(courseId: string, jobId?: string): Promise<void> {
    const spreadsheet = await this.spreadsheetRepo.findOne({ where: { courseId } });
    if (!spreadsheet?.spreadsheetId) throw new Error('Curso sin Sheet vinculado');

    const client = await this.authService.getActiveClient();
    if (!client) throw new Error('Credenciales de Google no configuradas');

    if (jobId) {
      await this.jobRepo.update(jobId, { status: 'PROCESSING', startedAt: new Date() });
    }

    try {
      const tabIds = await this.ensureTabs(client.sheets, spreadsheet.spreadsheetId);

      const data = await this.fetchCourseData(courseId);

      await this.writeAttendanceSheet(client.sheets, spreadsheet.spreadsheetId, data.students, data.sessions, data.attendanceMap, data.partialsMap, tabIds[0]);
      await this.writeLogSheet(client.sheets, spreadsheet.spreadsheetId, data.sessions, data.activityMap, data.partialsMap, tabIds[1]);
      await this.writeDetailSheet(client.sheets, spreadsheet.spreadsheetId, data.students, data.sessions, data.activityMap, data.signatureMap, data.scoreMap, data.partialsMap, tabIds[2]);
      await this.writeSummarySheet(client.sheets, spreadsheet.spreadsheetId, data.students, data.sessions, data.activityMap, data.signatureMap, data.scoreMap, data.partialsMap, tabIds[3]);

      const attCols = 1 + data.sessions.length + [1,2,3].filter(p => data.sessions.some(s => (data.partialsMap.get(s.id)||1)===p)).length;
      const attRows = 2 + data.students.length;
      const logRows = 1 + data.sessions.length;
      const detailCols = 1 + [...data.activityMap.values()].reduce((sum, acts) => sum + acts.length, 0);
      const detailRows = 3 + data.students.length;
      const sumRows = 1 + data.students.length;

      await this.applyFormatting(client.sheets, spreadsheet.spreadsheetId, tabIds[0], attCols, attRows, 2);
      await this.applyFormatting(client.sheets, spreadsheet.spreadsheetId, tabIds[1], 8, logRows, 1);
      await this.applyFormatting(client.sheets, spreadsheet.spreadsheetId, tabIds[2], detailCols, detailRows, 3);
      await this.applyFormatting(client.sheets, spreadsheet.spreadsheetId, tabIds[3], 7, sumRows, 1);

      await this.resizeColumns(client.sheets, spreadsheet.spreadsheetId, tabIds[0], [{ col: 0, w: 220 }, ...data.sessions.map((_, i) => ({ col: i + 1, w: 80 }))]);
      await this.resizeColumns(client.sheets, spreadsheet.spreadsheetId, tabIds[1], [
        { col: 0, w: 60 }, { col: 1, w: 100 }, { col: 2, w: 160 }, { col: 3, w: 200 }, { col: 4, w: 320 }, { col: 5, w: 260 }, { col: 6, w: 120 }, { col: 7, w: 120 },
      ]);
      await this.resizeColumns(client.sheets, spreadsheet.spreadsheetId, tabIds[2], [{ col: 0, w: 200 }, ...Array.from({ length: detailCols - 1 }, (_, i) => ({ col: i + 1, w: 80 }))]);
      await this.resizeColumns(client.sheets, spreadsheet.spreadsheetId, tabIds[3], [
        { col: 0, w: 200 }, { col: 1, w: 85 }, { col: 2, w: 85 }, { col: 3, w: 85 }, { col: 4, w: 85 }, { col: 5, w: 85 }, { col: 6, w: 85 },
      ]);

      await this.spreadsheetRepo.update(courseId, {
        lastSyncedAt: new Date() as any,
        lastSyncedClassId: data.sessions.length > 0 ? data.sessions[data.sessions.length - 1].id : undefined,
        lastError: undefined as any,
        templateVersion: COURSE_SHEET_TEMPLATE_VERSION,
      });

      if (jobId) {
        await this.jobRepo.update(jobId, { status: 'COMPLETED', completedAt: new Date() });
      }
    } catch (error: any) {
      const message = error?.message || 'Error desconocido';
      await this.spreadsheetRepo.update(courseId, { lastError: message });
      if (jobId) {
        await this.jobRepo.update(jobId, { status: 'FAILED', lastError: message });
      }
      throw error;
    }
  }

  private async ensureTabs(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<number[]> {
    const { data } = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
    const existing = (data.sheets || []).map((s, i) => ({
      sheetId: s.properties?.sheetId ?? i,
      title: s.properties?.title || '',
    }));

    const names = tabNames();
    const requests: sheets_v4.Schema$Request[] = [];

    for (let i = 0; i < names.length; i++) {
      if (i < existing.length) {
        if (existing[i].title !== names[i]) {
          requests.push({
            updateSheetProperties: {
              properties: { sheetId: existing[i].sheetId, title: names[i] },
              fields: 'title',
            },
          } as any);
        }
      } else {
        requests.push({
          addSheet: { properties: { title: names[i] } },
        } as any);
      }
    }

    for (let i = names.length; i < existing.length; i++) {
      requests.push({
        deleteSheet: { sheetId: existing[i].sheetId },
      } as any);
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
    }

    const { data: updated } = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
    return (updated.sheets || []).slice(0, names.length).map((s, i) => s.properties?.sheetId ?? i);
  }

  private async fetchCourseData(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    const p1Ends = course?.partial1EndsAt || null;
    const p2Ends = course?.partial2EndsAt || null;

    const students = await this.enrollmentRepo.find({
      where: { courseId, status: 'ACTIVE' as any },
      relations: ['student'],
    });

    const sessions = await this.sessionRepo.find({
      where: { courseId, status: In([SessionStatus.CLOSED]) },
      order: { sessionDate: 'ASC' },
    });

    const sessionIds = sessions.map((s) => s.id);

    const attendances = sessionIds.length > 0
      ? await this.attendanceRepo.find({ where: { classSessionId: In(sessionIds) } })
      : [];
    const attendanceMap = new Map<string, Map<string, string>>();
    for (const a of attendances) {
      if (!attendanceMap.has(a.classSessionId)) attendanceMap.set(a.classSessionId, new Map());
      attendanceMap.get(a.classSessionId)!.set(a.enrollmentId, a.effectiveStatus);
    }

    const activities = sessionIds.length > 0
      ? await this.activityRepo.find({ where: { classSessionId: In(sessionIds) } })
      : [];
    const activityIds = activities.map((a) => a.id);

    const signatures = activityIds.length > 0
      ? await this.signatureRepo
          .createQueryBuilder('sr')
          .where('sr.activity_id IN (:...ids)', { ids: activityIds })
          .andWhere('sr.canceled_at IS NULL')
          .getMany()
      : [];
    const signatureMap = new Map<string, Map<string, number>>();
    for (const s of signatures) {
      if (!signatureMap.has(s.activityId)) signatureMap.set(s.activityId, new Map());
      const prev = signatureMap.get(s.activityId)!.get(s.enrollmentId) || 0;
      signatureMap.get(s.activityId)!.set(s.enrollmentId, prev + s.quantity);
    }

    const scores = activityIds.length > 0
      ? await this.scoreRepo.find({ where: { activityId: In(activityIds) } })
      : [];
    const scoreMap = new Map<string, Map<string, number>>();
    for (const s of scores) {
      if (!scoreMap.has(s.activityId)) scoreMap.set(s.activityId, new Map());
      scoreMap.get(s.activityId)!.set(s.enrollmentId, s.score);
    }

    const activityMap = new Map<string, typeof activities[0][]>();
    for (const a of activities) {
      if (!activityMap.has(a.classSessionId!)) activityMap.set(a.classSessionId!, []);
      activityMap.get(a.classSessionId!)!.push(a);
    }

    const partialsMap = new Map<string, number>();
    for (const s of sessions) {
      partialsMap.set(s.id, this.computePartial(s.sessionDate as unknown as string, p1Ends, p2Ends));
    }

    return {
      students: students.map((e) => ({ enrollmentId: e.id, fullName: `${e.student.firstName} ${e.student.lastName}`, studentCode: e.student.studentCode })),
      sessions,
      attendanceMap,
      activityMap,
      signatureMap,
      scoreMap,
      partialsMap,
    };
  }

  private computePartial(date: string, p1: string | null, p2: string | null): number {
    if (!p1 && !p2) return 1;
    const d = new Date(`${date}T12:00:00`);
    if (p1 && d <= new Date(`${p1}T23:59:59`)) return 1;
    if (p2 && d <= new Date(`${p2}T23:59:59`)) return 2;
    return 3;
  }

  private async writeAttendanceSheet(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    students: any[],
    sessions: ClassSessionEntity[],
    attendanceMap: Map<string, Map<string, string>>,
    partialsMap: Map<string, number>,
    sheetId: number,
  ) {
    const pLabels: Record<number, string> = { 1: 'Parcial 1', 2: 'Parcial 2', 3: 'Parcial Final' };
    const grouped: Record<number, ClassSessionEntity[]> = { 1: [], 2: [], 3: [] };
    for (const s of sessions) { const p = partialsMap.get(s.id) || 1; grouped[p].push(s); }

    const header1: any[] = ['Estudiante'];
    const header2: any[] = [''];

    const colsPerP: Record<number, number> = {};
    for (const p of [1, 2, 3]) {
      const n = grouped[p].length;
      colsPerP[p] = n;
      if (n > 0) {
        header1.push(pLabels[p]);
        for (let i = 1; i < n; i++) header1.push('');
        for (const s of grouped[p]) {
          header2.push(`${new Date(s.sessionDate as any).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}`);
        }
      }
    }

    for (const p of [1, 2, 3]) {
      if (colsPerP[p] > 0) {
        header1.push(`Total ${pLabels[p]}`);
        header2.push('P/A');
      }
    }

    const values: any[][] = [header1, header2];

    for (const student of students) {
      const row: any[] = [student.fullName];
      for (const p of [1, 2, 3]) {
        let present = 0;
        let absent = 0;
        for (const s of grouped[p]) {
          const st = attendanceMap.get(s.id)?.get(student.enrollmentId);
          const sym = this.attendanceSymbol(st);
          row.push(sym);
          if (sym === 'P') present++;
          else if (sym === 'A' || sym === 'T') absent++;
        }
      }
      for (const p of [1, 2, 3]) {
        if (colsPerP[p] > 0) {
          const st2 = grouped[p].reduce((acc, s) => {
            const a = attendanceMap.get(s.id)?.get(student.enrollmentId);
            const sym = this.attendanceSymbol(a);
            return { p: acc.p + (sym === 'P' ? 1 : 0), a: acc.a + (sym === 'A' || sym === 'T' ? 1 : 0) };
          }, { p: 0, a: 0 });
          row.push(`${st2.p}/${st2.a}`);
        }
      }
      values.push(row);
    }

    const sheetName = tabNames()[0];
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${sheetName}'!A1:ZZ10000` });
    if (values.length > 0) {
      await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${sheetName}'!A1`, valueInputOption: 'RAW', requestBody: { values } });

      const mergeRequests: sheets_v4.Schema$Request[] = [];
      let col = 1;
      for (const p of [1, 2, 3]) {
        const n = colsPerP[p];
        if (n > 1) {
          mergeRequests.push({
            mergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: col, endColumnIndex: col + n }, mergeType: 'MERGE_ALL' },
          } as any);
        }
        if (n > 0) {
          col += n;
          mergeRequests.push({
            mergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: col, endColumnIndex: col + 1 }, mergeType: 'MERGE_ALL' },
          } as any);
          col += 1;
        }
      }
      if (mergeRequests.length > 0) {
        await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: mergeRequests } });
      }
    }
  }

  private attendanceSymbol(status: string | undefined): string {
    return { PRESENT: 'P', LATE: 'T', ABSENT: 'A', JUSTIFIED: 'J', EARLY_LEAVE: 'P' }[status || ''] || '';
  }

  private async writeLogSheet(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sessions: ClassSessionEntity[],
    activityMap: Map<string, ActivityEntity[]>,
    partialsMap: Map<string, number>,
    sheetId: number,
  ) {
    const partialLabels: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3' };
    const rows: any[][] = [['Parcial', 'Fecha', 'Clase', 'Tema', 'Bitácora', 'Actividades', 'Observaciones', 'Cerrada el']];

    for (const s of sessions) {
      const p = partialsMap.get(s.id) || 1;
      const acts = activityMap.get(s.id) || [];
      const parsed = this.parseSessionNotes(s.notes);

      rows.push([
        partialLabels[p],
        s.sessionDate,
        s.topicTaught || s.id.slice(0, 8),
        parsed.logTopic || s.topicTaught || '',
        parsed.logContent || '',
        acts.map((a) => a.title).join(', '),
        '',
        s.closedAt ? new Date(s.closedAt).toLocaleString('es-BO') : '',
      ]);
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${tabNames()[1]}'!A1:ZZ10000` });
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabNames()[1]}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      });
    }
  }

  private async writeDetailSheet(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    students: any[],
    sessions: ClassSessionEntity[],
    activityMap: Map<string, ActivityEntity[]>,
    signatureMap: Map<string, Map<string, number>>,
    scoreMap: Map<string, Map<string, number>>,
    partialsMap: Map<string, number>,
    sheetId: number,
  ) {
    const partialLabels: Record<number, string> = { 1: 'Parcial 1', 2: 'Parcial 2', 3: 'Parcial Final' };

    const sorted = [...sessions].sort((a, b) => {
      const pa = partialsMap.get(a.id) || 1;
      const pb = partialsMap.get(b.id) || 1;
      if (pa !== pb) return pa - pb;
      return new Date(a.sessionDate as any).getTime() - new Date(b.sessionDate as any).getTime();
    });

    let header1: any[] = ['Estudiante'];
    let header2: any[] = [''];
    let header3: any[] = [''];

    const colMap: Array<{ sessionId: string; activityId: string; gradingMode: string; title: string }> = [];

    let lastPartial = 0;
    for (const s of sorted) {
      const p = partialsMap.get(s.id) || 1;
      const acts = activityMap.get(s.id) || [];
      const dateLabel = `${new Date(s.sessionDate as any).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}`;

      if (acts.length === 0) continue;

      for (const a of acts) {
        colMap.push({ sessionId: s.id, activityId: a.id, gradingMode: a.gradingMode, title: a.title });
        header3.push(`${a.title} (${a.gradingMode === 'SIGNATURES' ? 'F' : 'N'})`);
      }

      const colsForSession = acts.length;
      if (p !== lastPartial) {
        lastPartial = p;
        header1.push(partialLabels[p]);
        for (let i = 1; i < colsForSession; i++) header1.push('');
      } else {
        for (let i = 0; i < colsForSession; i++) header1.push('');
      }

      header2.push(dateLabel);
      for (let i = 1; i < colsForSession; i++) header2.push('');
    }

    const values: any[][] = [header1, header2, header3];

    for (const student of students) {
      const row: any[] = [student.fullName];
      for (const col of colMap) {
        if (col.gradingMode === 'SIGNATURES') {
          row.push(signatureMap.get(col.activityId)?.get(student.enrollmentId) || 0);
        } else {
          const score = scoreMap.get(col.activityId)?.get(student.enrollmentId);
          row.push(score !== undefined && score !== null ? score : '');
        }
      }
      values.push(row);
    }

    const sheetName = tabNames()[2];
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${sheetName}'!A1:ZZ10000` });

    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      const mergeRequests: sheets_v4.Schema$Request[] = [];
      let col = 1;

      let currentPartial = 0;
      let partialStartCol = 1;
      let partialEndCol = 0;

      for (const s of sorted) {
        const p = partialsMap.get(s.id) || 1;
        const acts = activityMap.get(s.id) || [];
        const n = acts.length;
        if (n === 0) continue;

        if (p !== currentPartial) {
          if (currentPartial !== 0 && partialEndCol > partialStartCol) {
            mergeRequests.push({
              mergeCells: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: partialStartCol,
                  endColumnIndex: partialEndCol,
                },
                mergeType: 'MERGE_ALL',
              },
            } as any);
          }
          currentPartial = p;
          partialStartCol = col;
        }

        if (n > 1) {
          mergeRequests.push({
            mergeCells: {
              range: {
                sheetId,
                startRowIndex: 1,
                endRowIndex: 2,
                startColumnIndex: col,
                endColumnIndex: col + n,
              },
              mergeType: 'MERGE_ALL',
            },
          } as any);
        }

        col += n;
        partialEndCol = col;
      }

      if (currentPartial !== 0 && partialEndCol > partialStartCol) {
        mergeRequests.push({
          mergeCells: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: partialStartCol,
              endColumnIndex: partialEndCol,
            },
            mergeType: 'MERGE_ALL',
          },
        } as any);
      }

      if (mergeRequests.length > 0) {
        await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: mergeRequests } });
      }
    }
  }

  private async writeSummarySheet(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    students: any[],
    sessions: ClassSessionEntity[],
    activityMap: Map<string, ActivityEntity[]>,
    signatureMap: Map<string, Map<string, number>>,
    scoreMap: Map<string, Map<string, number>>,
    partialsMap: Map<string, number>,
    sheetId: number,
  ) {
    const values: any[][] = [['Estudiante', 'P1 Firmas', 'P1 Promedio', 'P2 Firmas', 'P2 Promedio', 'P3 Firmas', 'P3 Promedio']];

    const allActivities = new Map<string, ActivityEntity>();
    for (const [, acts] of activityMap) for (const a of acts) allActivities.set(a.id, a);

    for (const student of students) {
      const row: any[] = [student.fullName];
      for (const p of [1, 2, 3]) {
        const pSessions = sessions.filter((s) => (partialsMap.get(s.id) || 1) === p);
        let totalSignatures = 0;
        const scores: number[] = [];

        for (const s of pSessions) {
          const acts = activityMap.get(s.id) || [];
          for (const a of acts) {
            if (a.gradingMode === 'SIGNATURES') {
              totalSignatures += signatureMap.get(a.id)?.get(student.enrollmentId) || 0;
            } else {
              const score = scoreMap.get(a.id)?.get(student.enrollmentId);
              if (score !== undefined && score !== null) scores.push(score);
            }
          }
        }

        const avg = scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : '';

        row.push(totalSignatures, avg);
      }
      values.push(row);
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${tabNames()[3]}'!A1:ZZ10000` });
    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabNames()[3]}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
  }

  private parseSessionNotes(raw?: string | null): { logTopic: string; logContent: string; baseNote: string | null } {
    if (!raw) return { logTopic: '', logContent: '', baseNote: null };
    if (raw.startsWith('SESSION_META|')) {
      try {
        const parsed = JSON.parse(raw.slice('SESSION_META|'.length));
        return {
          logTopic: String(parsed.logTopic || ''),
          logContent: String(parsed.logContent || ''),
          baseNote: parsed.baseNote || null,
        };
      } catch { /* ignore */ }
    }
    if (raw.startsWith('ADDITIONAL_SESSION|')) {
      return { logTopic: '', logContent: '', baseNote: raw.slice('ADDITIONAL_SESSION|'.length) || null };
    }
    return { logTopic: '', logContent: '', baseNote: raw };
  }

  private getSheetId(name: string): number {
    const ids: Record<string, number> = { 'Asistencia': 0, 'Clases - Bitácora': 1, 'Detalle': 2, 'Resumen': 3 };
    return ids[name] ?? 0;
  }

  private async applyFormatting(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetId: number,
    dataCols: number,
    dataRows: number,
    frozenRows: number,
  ) {
    if (dataCols <= 1 || dataRows <= 1) return;

    const HEADER_BG = { red: 0.118, green: 0.161, blue: 0.275 };
    const HEADER_FG = { red: 1, green: 1, blue: 1 };
    const ZEBRA_BG = { red: 0.961, green: 0.961, blue: 0.961 };
    const BORDER_COLOR = { red: 0.82, green: 0.82, blue: 0.82 };
    const ACCENT_BG = { red: 0.922, green: 0.945, blue: 0.976 };

    const requests: sheets_v4.Schema$Request[] = [
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: frozenRows } },
          fields: 'gridProperties.frozenRowCount',
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: frozenRows, startColumnIndex: 0, endColumnIndex: dataCols },
          cell: {
            userEnteredFormat: {
              backgroundColor: HEADER_BG,
              textFormat: { foregroundColor: HEADER_FG, bold: true, fontSize: 10, fontFamily: 'Roboto' },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
              wrapStrategy: 'WRAP',
              padding: { top: 8, bottom: 8, left: 8, right: 8 },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy,padding)',
        },
      },
      {
        updateBorders: {
          range: { sheetId, startRowIndex: 0, endRowIndex: dataRows, startColumnIndex: 0, endColumnIndex: dataCols },
          top: { style: 'SOLID', width: 2, color: HEADER_BG },
          bottom: { style: 'SOLID', width: 2, color: HEADER_BG },
          left: { style: 'SOLID', width: 2, color: HEADER_BG },
          right: { style: 'SOLID', width: 2, color: HEADER_BG },
          innerHorizontal: { style: 'SOLID', width: 1, color: BORDER_COLOR },
          innerVertical: { style: 'SOLID', width: 1, color: BORDER_COLOR },
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: frozenRows, endRowIndex: dataRows, startColumnIndex: 0, endColumnIndex: dataCols },
          cell: {
            userEnteredFormat: {
              verticalAlignment: 'MIDDLE',
              wrapStrategy: 'WRAP',
              padding: { top: 6, bottom: 6, left: 8, right: 8 },
            },
          },
          fields: 'userEnteredFormat(verticalAlignment,wrapStrategy,padding)',
        },
      },
    ];

    for (let row = frozenRows; row < dataRows; row += 2) {
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: 0, endColumnIndex: dataCols },
          cell: { userEnteredFormat: { backgroundColor: ZEBRA_BG } },
          fields: 'userEnteredFormat(backgroundColor)',
        },
      } as any);
    }

    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }

  private async resizeColumns(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetId: number,
    widths: Array<{ col: number; w: number }>,
  ) {
    const requests = widths.map(({ col, w }) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: col, endIndex: col + 1 },
        properties: { pixelSize: w },
        fields: 'pixelSize',
      },
    }));

    const CHUNK = 60;
    for (let i = 0; i < requests.length; i += CHUNK) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: requests.slice(i, i + CHUNK) },
      });
    }
  }

}
