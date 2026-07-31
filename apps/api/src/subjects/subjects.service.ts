import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectEntity } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(SubjectEntity)
    private readonly repository: Repository<SubjectEntity>,
  ) {}

  findAll() {
    return this.repository.find();
  }

  findOne(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  create(createDto: Partial<SubjectEntity>) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: Partial<SubjectEntity>) {
    await this.repository.update(id, updateDto);
    return this.repository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { id };
  }
}
