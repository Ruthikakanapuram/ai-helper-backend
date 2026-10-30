import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { CreateChatSessionDto, UpdateChatSessionDto } from './dto/chat-session.dto';
import { ActivitiesService } from '../activities/activities.service';
import { Principal } from '../common/guards/ownership';
import { Role } from '../common/enums/role.enum';
import { Student } from 'src/students/entities/student.entity';
import { ActivityStatus, ChatSessionStatus } from 'src/common/enums/common.enum';
@Injectable()
export class ChatSessionsService {
 constructor(@InjectRepository(ChatSession) private repo: Repository<ChatSession>,
 
     @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,


 private activities: ActivitiesService) {}




async create(
  dto: CreateChatSessionDto,
  user: Principal,
) {
  // 1. Validate role
  if (
    user.role !== Role.STUDENT &&
    user.role !== Role.ADMIN
  ) {
    throw new ForbiddenException(
      'Not permitted to create student sessions',
    );
  }

  let student: Student;

  // 2. Resolve Student profile
  if (user.role === Role.STUDENT) {
    // JWT userId references users.id
    student = await this.getStudentByUserId(
      user.userId,
    );

    // Optional studentId, if supplied, must refer
    // to the authenticated student's profile.
    if (
      dto.studentId != null &&
      String(dto.studentId) !== String(student.id)
    ) {
      throw new ForbiddenException(
        'Student ID mismatch',
      );
    }
  } else {
    // Admin may explicitly supply students.id
    if (dto.studentId == null) {
      throw new BadRequestException(
        'studentId is required for admin',
      );
    }

    const record = await this.studentRepo.findOneBy({
      id: dto.studentId,
    });

    if (!record) {
      throw new NotFoundException(
        'Student not found',
      );
    }

    student = record;
  }

  // 3. Obtain actual students.id
  const studentId = student.id;
  const activityId = dto.activityId;

  // 4. Check whether a session already exists
  const existingSession = await this.repo.findOne({
    where: {
      activityId,
      studentId,
    },
  });

  if (existingSession) {
    // Return the same session.
    // Do not reset status or startedAt.
    return existingSession;
  }

  // 5. Verify activity is currently running
  const activity = await this.activities.findOne(
    activityId,
    user,
  );

  if (activity.status !== ActivityStatus.PUBLISHED) {
    throw new BadRequestException(
      'Activity is not currently running',
    );
  }

  if (!activity.startedAt) {
    throw new BadRequestException(
      'Activity has not started',
    );
  }

  const startedAt = new Date(
    activity.startedAt,
  ).getTime();

  const deadline =
    startedAt + activity.duration * 60_000;

  if (
    !Number.isFinite(startedAt) ||
    Date.now() >= deadline
  ) {
    throw new BadRequestException(
      'Activity duration has expired',
    );
  }

  // 6. Create new session
  try {
    const session = this.repo.create({
      activityId,
      studentId,
      status: ChatSessionStatus.ACTIVE,
    });

    return await this.repo.save(session);
  } catch (error) {
    // Handle two simultaneous requests from the same student
    const dbError = error as {
      driverError?: {
        code?: string;
      };
    };

    if (dbError.driverError?.code === 'ER_DUP_ENTRY') {
      const existing = await this.repo.findOne({
        where: {
          activityId,
          studentId,
        },
      });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
}




async assertAccess(
  id: number,
  user: Principal,
) {
  const session = await this.repo.findOne({
    where: { id },
    relations: ['activity', 'student'],
  });

  if (!session) {
    throw new NotFoundException('Session not found');
  }

  if (user.role === Role.ADMIN) {
    return session;
  }

  if (user.role === Role.STUDENT) {
    if (
      String(session.student.userId) !==
      String(user.userId)
    ) {
      throw new ForbiddenException(
        'Not your chat session',
      );
    }

    return session;
  }

  if (user.role === Role.TEACHER) {
    if (
      String(session.activity.teacherId) !==
      String(user.userId)
    ) {
      throw new ForbiddenException(
        'Not your activity',
      );
    }

    return session;
  }

  throw new ForbiddenException('Access denied');
}

 async findAll(user: Principal, activityId?: number) {
  const qb = this.repo.createQueryBuilder('s').innerJoin('s.activity', 'a');
  if (user.role === Role.STUDENT) qb.andWhere('s.student_id = :id', { id: user.userId });
  if (user.role === Role.TEACHER) qb.andWhere('a.teacher_id = :id', { id: user.userId });
  if (activityId) qb.andWhere('s.activity_id = :activityId', { activityId });
  return qb.orderBy('s.id', 'DESC').getMany();
 }
//  async update(id: number, dto: UpdateChatSessionDto, user: Principal) {
//   const session = await this.assertAccess(id, user);
//   if (user.role === Role.STUDENT && dto.status !== 'COMPLETED') throw new ForbiddenException('Student may only complete a session');
//   if (dto.status) {
//    session.status = dto.status;
//    session.endedAt = dto.status === 'ACTIVE' ? null : new Date();
//   }
//   return this.repo.save(session);
//  }
 async remove(id: number, user: Principal) {
  if (user.role !== Role.ADMIN) throw new ForbiddenException('Only admin may delete sessions');
  const session = await this.assertAccess(id, user);
  await this.repo.remove(session); return { deleted: true };
 }


 private async getStudentByUserId(
  userId: number,
): Promise<Student> {
  const student = await this.studentRepo.findOne({
    where: { userId },
  });

  if (!student) {
    throw new NotFoundException(
      'Student profile not found for this user',
    );
  }

  return student;
}
}
