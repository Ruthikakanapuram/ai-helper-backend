import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { Principal } from '../common/guards/ownership';
import { Role } from '../common/enums/role.enum';
@Injectable()
export class ActivitiesService {
 constructor(@InjectRepository(Activity) private repo: Repository<Activity>) {}
 private validateDates(start?: Date | null, end?: Date | null) {
  if (start && end && end <= start) throw new BadRequestException('endsAt must be after startsAt');
 }
 async create(dto: CreateActivityDto, user: Principal) {
  const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
  const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
  this.validateDates(startsAt, endsAt);
  return this.repo.save(this.repo.create({ ...dto, teacherId: user.userId, startsAt, endsAt }));
 }
 findAll(user: Principal) {
  return this.repo.find({ where: user.role === Role.ADMIN ? {} : user.role === Role.TEACHER ? { teacherId: user.userId } : { status: 'PUBLISHED' }, order: { id: 'DESC' } });
 }
 async findOne(id: number, user?: Principal) {
  const item = await this.repo.findOneBy({ id });
  if (!item) throw new NotFoundException('Activity not found');
  if (user?.role === Role.TEACHER && item.teacherId !== user.userId) throw new ForbiddenException('Not your activity');
  if (user?.role === Role.STUDENT && item.status !== 'PUBLISHED') throw new ForbiddenException('Activity unavailable');
  return item;
 }
 async requireOwner(id: number, user: Principal) {
  const item = await this.findOne(id);
  if (user.role !== Role.ADMIN && item.teacherId !== user.userId) throw new ForbiddenException('Not your activity');
  return item;
 }
 async update(id: number, dto: UpdateActivityDto, user: Principal) {
  const item = await this.requireOwner(id, user);
  const startsAt = dto.startsAt !== undefined ? new Date(dto.startsAt) : item.startsAt;
  const endsAt = dto.endsAt !== undefined ? new Date(dto.endsAt) : item.endsAt;
  this.validateDates(startsAt, endsAt);
  Object.assign(item, dto, { startsAt, endsAt });
  return this.repo.save(item);
 }
 async remove(id: number, user: Principal) {
  const item = await this.requireOwner(id, user);
  await this.repo.remove(item); return { deleted: true };
 }
}
