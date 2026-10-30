
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, In, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { ActivityStudent } from './activity-student.entity';
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

    @InjectRepository(ActivityStudent)
    private readonly activityStudentRepo: Repository<ActivityStudent>,

    private readonly dataSource: DataSource,
  ) { }

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

    const studentIds = [...new Set(dto.studentIds ?? [])];

    if (studentIds.length === 0) {
      throw new BadRequestException(
        'Select at least one student',
      );
    }

    return this.repo.manager.transaction(async (manager) => {
      const studentRepo = manager.getRepository(Student);
      const activityRepo = manager.getRepository(Activity);
      const assignmentRepo = manager.getRepository(ActivityStudent);

      // Validate selected IDs against the students table.
      const students = await studentRepo.find({
        where: {
          id: In(studentIds),
          user: {
            role: Role.STUDENT,
            status: 'ACTIVE',
          },
        },
        relations: {
          user: true,
        },
      });

      if (students.length !== studentIds.length) {
        throw new BadRequestException(
          'One or more selected students do not exist or are inactive',
        );
      }

      const activity = activityRepo.create({
        title: dto.title,
        topic: dto.title.trim(),
        description: dto.description ?? null,
        duration,
        scheduledDate: dto.scheduledDate,
        status: dto.status ?? ActivityStatus.SCHEDULED,
        teacherId: user.userId,
      });

      const savedActivity = await activityRepo.save(activity);

      const assignments = studentIds.map((studentId) =>
        assignmentRepo.create({
          activityId: savedActivity.id,
          studentId,
        }),
      );

      await assignmentRepo.save(assignments);

      return {
        message: 'Activity created and students assigned successfully',
        activity: savedActivity,
        assignedStudentIds: studentIds,
        assignedCount: studentIds.length,
      };
    });
  }

  // GET ALL

async findAll(user: Principal) {
  if (user.role === Role.ADMIN) {
    return this.repo.find({
      order: { id: 'DESC' },
    });
  }

  if (user.role === Role.TEACHER) {
    return this.repo.find({
      where: {
        teacherId: user.userId,
      },
      order: { id: 'DESC' },
    });
  }

  if (user.role !== Role.STUDENT) {
    throw new ForbiddenException('Unsupported role');
  }

  // 1. Resolve students.id from the JWT users.id.
  const student = await this.repo.manager
    .getRepository(Student)
    .findOne({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
      },
    });

  if (!student) {
    return [];
  }

  // 2. Fetch assigned activities and the logged-in
  // student's corresponding chat session.
  const rows = await this.repo
    .createQueryBuilder('activity')
    .innerJoin(
      ActivityStudent,
      'assignment',
      'assignment.activityId = activity.id',
    )
    .leftJoin(
      ChatSession,
      'session',
      `session.activityId = activity.id
       AND session.studentId = :studentId`,
      { studentId: student.id },
    )
    .where('assignment.studentId = :studentId', {
      studentId: student.id,
    })
    .select([
      'activity.id AS activityId',
      'activity.title AS title',
      'activity.topic AS topic',
      'activity.description AS description',
      'activity.status AS activityStatus',
      'activity.duration AS duration',
      'activity.scheduledDate AS scheduledDate',
      'activity.startedAt AS activityStartedAt',
      'activity.endedAt AS activityEndedAt',
      'session.id AS sessionId',
      'session.status AS sessionStatus',
      'session.startedAt AS sessionStartedAt',
      'session.endedAt AS sessionEndedAt',
    ])
    .orderBy('activity.id', 'DESC')
    .getRawMany();

  // 3. Return activity data with its existing session.
  return rows.map((row) => ({
    id: String(row.activityId),
    title: row.title,
    topic: row.topic,
    description: row.description,
    status: row.activityStatus,
    duration: row.duration,
    scheduledDate: row.scheduledDate,
    startedAt: row.activityStartedAt,
    endedAt: row.activityEndedAt,

    chatSession: row.sessionId
      ? {
          id: String(row.sessionId),
          status: row.sessionStatus,
          startedAt: row.sessionStartedAt,
          endedAt: row.sessionEndedAt,
        }
      : null,
  }));
}

  // GET ONE
  async findOne(
    id: number,
    user?: Principal,
  ) {
    const item = await this.repo.findOneBy({ id });

    if (!item) {
      throw new NotFoundException('Activity not found');
    }

    if (user?.role === Role.TEACHER &&
      item.teacherId !== user.userId) {
      throw new ForbiddenException('Not your activity');
    }

    if (user?.role === Role.STUDENT) {
      if (item.status !== ActivityStatus.PUBLISHED) {
        throw new ForbiddenException('Activity unavailable');
      }

      const student = await this.repo.manager
        .getRepository(Student)
        .findOne({
          where: { userId: user.userId },
          select: { id: true },
        });

      if (!student) {
        throw new ForbiddenException('Student profile not found');
      }

      const assigned = await this.activityStudentRepo.exists({
        where: {
          activityId: item.id,
          studentId: student.id,
        },
      });

      if (!assigned) {
        throw new ForbiddenException(
          'This activity is not assigned to you',
        );
      }
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
