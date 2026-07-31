import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleAuthService } from './google-auth.service';
import { CourseSpreadsheetEntity } from '../entities/course-spreadsheet.entity';
import { CourseEntity } from '../../../courses/entities/course.entity';
import { COURSE_SHEET_TEMPLATE_VERSION, tabNames } from './spreadsheet-template.service';

@Injectable()
export class SpreadsheetCreatorService {
  private readonly logger = new Logger(SpreadsheetCreatorService.name);

  constructor(
    @InjectRepository(CourseSpreadsheetEntity)
    private readonly spreadsheetRepo: Repository<CourseSpreadsheetEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    private readonly authService: GoogleAuthService,
  ) {}

  async createSheet(courseId: string): Promise<CourseSpreadsheetEntity> {
    const existing = await this.spreadsheetRepo.findOne({ where: { courseId } });
    if (existing?.spreadsheetId) {
      throw new BadRequestException('El curso ya tiene un Sheet vinculado');
    }

    const client = await this.authService.getActiveClient();
    if (!client) throw new BadRequestException('Credenciales de Google no configuradas');

    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['subject', 'academicPeriod'],
    });
    if (!course) throw new BadRequestException('Curso no encontrado');

    const parallel = course.parallel;
    const subjectName = course.subject?.name || course.subject?.code || 'Curso';
    const periodName = course.academicPeriod?.name || '';
    const title = `${subjectName} - ${periodName} - ${parallel}`;

    try {
      let spreadsheetId: string;

      try {
        const { data } = await client.sheets.spreadsheets.create({
          requestBody: {
            properties: { title },
            sheets: tabNames().map((name) => ({ properties: { title: name } })),
          },
        });
        spreadsheetId = data.spreadsheetId!;
      } catch (sheetsError: any) {
        if (sheetsError?.message?.includes('quota') || sheetsError?.message?.includes('permission')) {
          const file = await client.drive.files.create({
            requestBody: { name: title, mimeType: 'application/vnd.google-apps.spreadsheet' },
            fields: 'id',
          });
          spreadsheetId = file.data.id!;

          const existing = await client.sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
          const defaultSheetId = existing.data.sheets?.[0]?.properties?.sheetId ?? 0;

          const requests: any[] = [];
          requests.push({ updateSheetProperties: { properties: { sheetId: defaultSheetId, title: tabNames()[0] }, fields: 'title' } });
          for (let i = 1; i < tabNames().length; i++) {
            requests.push({ addSheet: { properties: { title: tabNames()[i] } } });
          }

          await client.sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
        } else {
          throw sheetsError;
        }
      }

      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      if (client.setting.shareWithEmail) {
        try {
          await client.drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: { type: 'user', role: 'writer', emailAddress: client.setting.shareWithEmail },
          });
        } catch (e: any) {
          this.logger.warn(`No se pudo compartir: ${e?.message}`);
        }
      }

      const entity = this.spreadsheetRepo.create({
        courseId,
        googleIntegrationSettingId: client.setting.id,
        spreadsheetId,
        spreadsheetUrl: url,
        spreadsheetName: title,
        templateVersion: COURSE_SHEET_TEMPLATE_VERSION,
        status: 'SYNCED',
      });

      return this.spreadsheetRepo.save(entity);
    } catch (error: any) {
      const msg = error?.message || '';
      const code = error?.code || error?.response?.status || '';

      if (msg.includes('quota') || msg.includes('exceeded')) {
        throw new BadRequestException(
          'Límite de Drive excedido para la cuenta de servicio. Liberá espacio en drive.google.com o esperá 24h para que se resetee el límite de creación.',
        );
      }
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED') || code === 403) {
        throw new BadRequestException(
          'Permiso denegado. Verificá: 1) Google Sheets API habilitada, 2) Google Drive API habilitada, 3) Cuenta de servicio con rol Editor en IAM.',
        );
      }
      if (msg.includes('not found') || msg.includes('NOT_FOUND') || code === 404) {
        throw new BadRequestException('API no encontrada. Verificá que ambas APIs estén habilitadas en Google Cloud Console.');
      }
      throw new BadRequestException(msg.includes('unsupported') ? 'La clave privada no es válida.' : `Error de Google: ${msg}`);
    }
  }

  async linkExisting(courseId: string, spreadsheetIdOrUrl: string): Promise<CourseSpreadsheetEntity> {
    const existing = await this.spreadsheetRepo.findOne({ where: { courseId } });
    if (existing?.spreadsheetId) {
      throw new BadRequestException('El curso ya tiene un Sheet vinculado');
    }

    const spreadsheetId = spreadsheetIdOrUrl.includes('/d/')
      ? spreadsheetIdOrUrl.split('/d/')[1]?.split('/')[0]
      : spreadsheetIdOrUrl;

    const client = await this.authService.getActiveClient();
    if (!client) throw new BadRequestException('Credenciales de Google no configuradas');

    try {
      const { data } = await client.sheets.spreadsheets.get({ spreadsheetId });
      const title = data.properties?.title || 'Sheet vinculado';
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      const entity = await this.spreadsheetRepo.save(
        this.spreadsheetRepo.create({
          courseId,
          googleIntegrationSettingId: client.setting.id,
          spreadsheetId,
          spreadsheetUrl: url,
          spreadsheetName: title,
          templateVersion: COURSE_SHEET_TEMPLATE_VERSION,
          status: 'SYNCED',
        }),
      );

      return entity;
    } catch {
      throw new BadRequestException('No se pudo acceder al Sheet. Verifica la URL y los permisos.');
    }
  }
}
