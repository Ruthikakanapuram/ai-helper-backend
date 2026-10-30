
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import {
  ActivityDuration,
  ActivityStatus,
  ChatSessionStatus,
} from '../common/enums/common.enum';
import { Activity } from './activity.entity';
import {
  CreateActivityDto,
  UpdateActivityDto,
  UpdateActivityStatusDto
} from './dto/activity.dto';

import { Principal } from '../common/guards/ownership';
import { Role } from '../common/enums/role.enum';
import { ChatSession } from 'src/chat-sessions/chat-session.entity';

@Injectable()
export class ActivitiesService {

  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
      private readonly dataSource: DataSource,

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
      status: dto.status ?? ActivityStatus.SCHEDULED,
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

  
async updateStatus(
  id: number,
  newStatus: ActivityStatus,
  user: Principal,
) {
  // Verify activity exists and logged-in user owns it.
  const activity = await this.requireOwner(id, user);

  let expectedStatus: ActivityStatus;
  const now = new Date();

  const changes: Partial<Activity> = {
    status: newStatus,
  };

  if (newStatus === ActivityStatus.PUBLISHED) {
    // Start only a scheduled activity.
    expectedStatus = ActivityStatus.SCHEDULED;

    changes.startedAt = now;
    changes.endedAt = null;
  } else if (newStatus === ActivityStatus.CLOSED) {
    // Stop only an activity that was started.
    expectedStatus = ActivityStatus.PUBLISHED;

    changes.endedAt = now;
  } else {
    throw new BadRequestException(
      'Unsupported activity status transition',
    );
  }

  if (activity.status !== expectedStatus) {
    throw new ConflictException(
      `Cannot change activity from ${activity.status} to ${newStatus}`,
    );
  }

  // Conditional database update prevents two competing
  // requests from both transitioning the same activity.
  const result = await this.repo.update(
    {
      id,
      status: expectedStatus,
    },
    changes,
  );

  if (result.affected !== 1) {
    throw new ConflictException(
      'Activity status was changed by another request',
    );
  }

  return this.findOne(id, user);
}



async closeExpiredActivities(): Promise<void> {
  // Get all currently published activities that have
  // reached their scheduled expiration time.
  const expiredActivities = await this.repo
    .createQueryBuilder('activity')
    .where('activity.status = :status', {
      status: ActivityStatus.PUBLISHED,
    })
    .andWhere('activity.started_at IS NOT NULL')
    .andWhere(
      'TIMESTAMPADD(MINUTE, activity.duration, activity.started_at) <= UTC_TIMESTAMP(6)',
    )
    .getMany();

  for (const activity of expiredActivities) {
    // Transactionally close the activity
    // and expire its active student sessions.
    await this.dataSource.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(Activity)
        .set({
          status: ActivityStatus.CLOSED,
          endedAt: new Date(),
        })
        .where('id = :id', { id: activity.id })
        .andWhere('status = :status', {
          status: ActivityStatus.PUBLISHED,
        })
        .andWhere(
          'TIMESTAMPADD(MINUTE, duration, started_at) <= UTC_TIMESTAMP(6)',
        )
        .execute();

      // Only expire sessions if the activity
      // was successfully transitioned.
      if (result.affected !== 1) {
        return;
      }

      await manager
        .createQueryBuilder()
        .update(ChatSession)
        .set({
          status: ChatSessionStatus.EXPIRED,
          endedAt: new Date(),
        })
        .where('activity_id = :activityId', {
          activityId: activity.id,
        })
        .andWhere('status = :status', {
          status: ChatSessionStatus.ACTIVE,
        })
        .execute();
    });
  }
}


}
