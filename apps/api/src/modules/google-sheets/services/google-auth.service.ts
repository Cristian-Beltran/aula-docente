import { Injectable, Logger } from '@nestjs/common';
import { google, sheets_v4, drive_v3 } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleIntegrationSettingEntity } from '../entities/google-integration-setting.entity';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    @InjectRepository(GoogleIntegrationSettingEntity)
    private readonly settingRepo: Repository<GoogleIntegrationSettingEntity>,
    private readonly configService: ConfigService,
  ) {}

  async getActiveClient(): Promise<{
    sheets: sheets_v4.Sheets;
    drive: drive_v3.Drive;
    setting: GoogleIntegrationSettingEntity;
  } | null> {
    const setting = await this.settingRepo.findOne({
      where: { status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
    });

    if (!setting) return null;

    const privateKey = this.cleanKey(this.decrypt(setting.encryptedPrivateKey));

    const auth = new google.auth.GoogleAuth({
      projectId: setting.projectId,
      credentials: {
        client_email: setting.serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    return {
      sheets: google.sheets({ version: 'v4', auth }),
      drive: google.drive({ version: 'v3', auth }),
      setting,
    };
  }

  async testConnection(setting: GoogleIntegrationSettingEntity): Promise<boolean> {
    const privateKey = this.cleanKey(this.decrypt(setting.encryptedPrivateKey));

    const auth = new google.auth.GoogleAuth({
      projectId: setting.projectId,
      credentials: {
        client_email: setting.serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.get({ spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', fields: 'spreadsheetId' });
    return true;
  }

  encrypt(raw: string): string {
    return Buffer.from(raw, 'utf-8').toString('base64');
  }

  decrypt(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  private cleanKey(key: string): string {
    let cleaned = key.replace(/\\n/g, '\n');
    if (!cleaned.includes('-----BEGIN')) {
      const start = cleaned.indexOf('BEGIN');
      if (start > 0) cleaned = cleaned.substring(start > 10 ? start - 10 : 0);
    }
    cleaned = cleaned.trim();
    if (!cleaned.endsWith('-----')) {
      cleaned = cleaned.replace(/-----[\s\S]*$/, (m) => m.trimEnd());
    }
    const lastEndIdx = cleaned.lastIndexOf('-----END');
    if (lastEndIdx > 0) {
      cleaned = cleaned.substring(0, lastEndIdx + 30).trimEnd();
    }
    return cleaned + '\n';
  }
}
