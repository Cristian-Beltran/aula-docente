import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/entities/user.entity';
import { SpreadsheetCreatorService } from '../services/spreadsheet-creator.service';
import { CourseSheetSyncService } from '../services/course-sheet-sync.service';
import { CourseSpreadsheetEntity } from '../entities/course-spreadsheet.entity';

@ApiTags('course-spreadsheet')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CourseSpreadsheetController {
  constructor(
    @InjectRepository(CourseSpreadsheetEntity)
    private readonly spreadsheetRepo: Repository<CourseSpreadsheetEntity>,
    private readonly creatorService: SpreadsheetCreatorService,
    private readonly syncService: CourseSheetSyncService,
  ) {}

  @Post(':courseId/google-sheet')
  async createSheet(@Param('courseId') courseId: string) {
    const entity = await this.creatorService.createSheet(courseId);
    await this.syncService.syncCourseSheet(courseId);
    return this.getStatus(courseId);
  }

  @Post(':courseId/google-sheet/link')
  async linkSheet(@Param('courseId') courseId: string, @Body() body: { spreadsheetId: string }) {
    await this.creatorService.linkExisting(courseId, body.spreadsheetId);
    await this.syncService.syncCourseSheet(courseId);
    return this.getStatus(courseId);
  }

  @Get(':courseId/google-sheet')
  async getStatus(@Param('courseId') courseId: string) {
    const entity = await this.spreadsheetRepo.findOne({ where: { courseId } });
    if (!entity?.spreadsheetId) {
      return { configured: false, status: 'NOT_CONFIGURED' };
    }
    return {
      configured: true,
      status: entity.status,
      spreadsheetId: entity.spreadsheetId,
      spreadsheetUrl: entity.spreadsheetUrl,
      spreadsheetName: entity.spreadsheetName,
      lastSyncedAt: entity.lastSyncedAt,
      lastSyncedClassId: entity.lastSyncedClassId,
      lastError: entity.lastError,
      templateVersion: entity.templateVersion,
    };
  }

  @Post(':courseId/google-sheet/sync')
  async syncSheet(@Param('courseId') courseId: string) {
    await this.syncService.syncCourseSheet(courseId);
    return this.getStatus(courseId);
  }

  @Post(':courseId/google-sheet/rebuild')
  async rebuildSheet(@Param('courseId') courseId: string) {
    await this.syncService.syncCourseSheet(courseId);
    return this.getStatus(courseId);
  }

  @Delete(':courseId/google-sheet')
  async unlinkSheet(@Param('courseId') courseId: string) {
    await this.spreadsheetRepo.delete({ courseId });
    return { configured: false, status: 'NOT_CONFIGURED' };
  }
}
