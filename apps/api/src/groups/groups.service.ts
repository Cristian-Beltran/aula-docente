import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateQueryBuilder } from '../common/utils/pagination.util';
import { ClassGroupEntity } from './entities/class-group.entity';
import { GroupMembershipEntity } from './entities/group-membership.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(ClassGroupEntity)
    private readonly groupRepository: Repository<ClassGroupEntity>,
    @InjectRepository(GroupMembershipEntity)
    private readonly membershipRepository: Repository<GroupMembershipEntity>,
  ) {}

  async findByCourse(courseId: string, query: PaginationQueryDto) {
    const qb = this.groupRepository.createQueryBuilder('group').where('group.course_id = :courseId', {
      courseId,
    });

    if (query.search) {
      qb.andWhere('(group.name ILIKE :search OR group.code ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy(`group.${query.sortBy ?? 'createdAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    return paginateQueryBuilder(qb, query);
  }

  findOne(id: string) {
    return this.groupRepository.findOne({ where: { id }, relations: ['memberships'] });
  }

  create(createDto: Partial<ClassGroupEntity>) {
    const entity = this.groupRepository.create(createDto);
    return this.groupRepository.save(entity);
  }

  async update(id: string, updateDto: Partial<ClassGroupEntity>) {
    await this.groupRepository.update(id, updateDto);
    return this.groupRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.groupRepository.delete(id);
    return { id };
  }

  async getMemberships(groupId: string, query: PaginationQueryDto) {
    const qb = this.membershipRepository
      .createQueryBuilder('membership')
      .leftJoinAndSelect('membership.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('membership.class_group_id = :groupId', { groupId });

    if (query.search) {
      qb.andWhere(
        '(student.student_code ILIKE :search OR student.first_name ILIKE :search OR student.last_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(`membership.${query.sortBy ?? 'assignedAt'}`, query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    return paginateQueryBuilder(qb, query);
  }
}
