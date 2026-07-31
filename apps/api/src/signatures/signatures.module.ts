import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEntity } from './entities/activity.entity';
import { SignatureRecordEntity } from './entities/signature-record.entity';
import { QrCredentialEntity } from './entities/qr-credential.entity';
import { SignaturesService } from './signatures.service';
import { SignaturesController } from './signatures.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityEntity, SignatureRecordEntity, QrCredentialEntity])],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}
