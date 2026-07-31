import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicPeriodEntity } from './entities/academic-period.entity';

@Injectable()
export class AcademicPeriodsService {
  constructor(
    @InjectRepository(AcademicPeriodEntity)
    private readonly repository: Repository<AcademicPeriodEntity>,
  ) {}

  findAll() {
    return this.repository.find();
  }

  findOne(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  create(createDto: Partial<AcademicPeriodEntity>) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async update(id: string, updateDto: Partial<AcademicPeriodEntity>) {
    await this.repository.update(id, updateDto);
    return this.repository.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repository.delete(id);
    return { id };
  }
}
