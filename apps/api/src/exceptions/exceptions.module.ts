import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionRequestEntity } from './entities/exception-request.entity';
import { AttachmentEntity } from './entities/attachment.entity';
import { ExceptionsService } from './exceptions.service';
import { ExceptionsController } from './exceptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExceptionRequestEntity, AttachmentEntity])],
  controllers: [ExceptionsController],
  providers: [ExceptionsService],
  exports: [ExceptionsService],
})
export class ExceptionsModule {}
