import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export function createR2Client(configService: ConfigService): S3Client {
  const accountId = configService.get<string>('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: configService.get<string>('R2_ACCESS_KEY_ID', ''),
      secretAccessKey: configService.get<string>('R2_SECRET_ACCESS_KEY', ''),
    },
  });
}
