import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassGroupEntity } from './entities/class-group.entity';
import { GroupMembershipEntity } from './entities/group-membership.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassGroupEntity, GroupMembershipEntity])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
