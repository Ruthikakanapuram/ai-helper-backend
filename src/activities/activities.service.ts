
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  ActivityDuration,
  ActivityStatus,
} from '../common/enums/common.enum';
import { Activity } from './activity.entity';
import {
  CreateActivityDto,
  UpdateActivityDto,
} from './dto/activity.dto';

import { Principal } from '../common/guards/ownership';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ActivitiesService {

  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  // Validate a real calendar date
  private validateScheduledDate(date: string): void {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) {
      throw new BadRequestException(
        'scheduledDate must use YYYY-MM-DD format',
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() + 1 !== month ||
      parsed.getUTCDate() !== day
    ) {
      throw new BadRequestException(
        'Invalid scheduledDate',
      );
    }
  }

  // Validate duration
  private validateDuration(duration: number): void {
    if (![20, 30, 45].includes(duration)) {
      throw new BadRequestException(
        'Duration must be 20, 30, or 45 minutes',
      );
    }
  }

  // CREATE
  async create(
    dto: CreateActivityDto,
    user: Principal,
  ) {
    this.validateScheduledDate(dto.scheduledDate);

    const duration =
      dto.duration ?? ActivityDuration.THIRTY_MINUTES;

    this.validateDuration(duration);

    const activity = this.repo.create({
      title: dto.title,
      topic: dto.topic,
      description: dto.description ?? null,
      duration,
      scheduledDate: dto.scheduledDate,
      status: dto.status ?? ActivityStatus.DRAFT,
      teacherId: user.userId,
    });

    return this.repo.save(activity);
  }

  // GET ALL
  findAll(user: Principal) {
    return this.repo.find({
      where:
        user.role === Role.ADMIN
          ? {}
          : user.role === Role.TEACHER
            ? { teacherId: user.userId }
            : { status: ActivityStatus.PUBLISHED },

      order: {
        id: 'DESC',
      },
    });
  }

  // GET ONE
  async findOne(
    id: number,
    user?: Principal,
  ) {
    const item = await this.repo.findOneBy({ id });

    if (!item) {
      throw new NotFoundException(
        'Activity not found',
      );
    }

    if (
      user?.role === Role.TEACHER &&
      item.teacherId !== user.userId
    ) {
      throw new ForbiddenException(
        'Not your activity',
      );
    }

    if (
      user?.role === Role.STUDENT &&
      item.status !== ActivityStatus.PUBLISHED
    ) {
      throw new ForbiddenException(
        'Activity unavailable',
      );
    }

    return item;
  }

  // CHECK OWNERSHIP
  async requireOwner(
    id: number,
    user: Principal,
  ) {
    const item = await this.findOne(id);

    if (
      user.role !== Role.ADMIN &&
      item.teacherId !== user.userId
    ) {
      throw new ForbiddenException(
        'Not your activity',
      );
    }

    return item;
  }

  // UPDATE
  async update(
    id: number,
    dto: UpdateActivityDto,
    user: Principal,
  ) {
    const item = await this.requireOwner(id, user);

    if (dto.scheduledDate !== undefined) {
      this.validateScheduledDate(dto.scheduledDate);
      item.scheduledDate = dto.scheduledDate;
    }

    if (dto.duration !== undefined) {
      this.validateDuration(dto.duration);
      item.duration = dto.duration;
    }

    if (dto.title !== undefined) {
      item.title = dto.title;
    }

    if (dto.topic !== undefined) {
      item.topic = dto.topic;
    }

    if (dto.description !== undefined) {
      item.description = dto.description;
    }

    if (dto.status !== undefined) {
      item.status = dto.status;
    }

    return this.repo.save(item);
  }

  // DELETE
  async remove(
    id: number,
    user: Principal,
  ) {
    const item = await this.requireOwner(id, user);

    await this.repo.remove(item);

    return { deleted: true };
  }
}
