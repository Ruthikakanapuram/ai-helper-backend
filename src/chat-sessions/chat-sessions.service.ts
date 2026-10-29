import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { CreateChatSessionDto, UpdateChatSessionDto } from './dto/chat-session.dto';
import { ActivitiesService } from '../activities/activities.service';
import { Principal } from '../common/guards/ownership';
import { Role } from '../common/enums/role.enum';
@Injectable()
export class ChatSessionsService {
 constructor(@InjectRepository(ChatSession) private repo: Repository<ChatSession>, private activities: ActivitiesService) {}
 async create(dto: CreateChatSessionDto, user: Principal) {
  const activity = await this.activities.findOne(dto.activityId);
  const studentId = user.role === Role.ADMIN && dto.studentId ? dto.studentId : user.userId;
  if (user.role === Role.TEACHER) throw new ForbiddenException('Teachers cannot create student sessions');
  if (user.role === Role.STUDENT && activity.status !== 'PUBLISHED') throw new BadRequestException('Activity is not published');
  if (user.role === Role.STUDENT && dto.studentId && dto.studentId !== user.userId) throw new ForbiddenException('Student mismatch');
  return this.repo.save(this.repo.create({ activityId: dto.activityId, studentId, sessionNumber: dto.sessionNumber || 1 }));
 }
 async assertAccess(id: number, user: Principal) {
  const session = await this.repo.findOne({ where: { id }, relations: ['activity'] });
  if (!session) throw new NotFoundException('Session not found');
  if (user.role !== Role.ADMIN && session.studentId !== user.userId &&
    !(user.role === Role.TEACHER && session.activity.teacherId === user.userId)) throw new ForbiddenException('Not permitted');
  return session;
 }
 async findAll(user: Principal, activityId?: number) {
  const qb = this.repo.createQueryBuilder('s').innerJoin('s.activity', 'a');
  if (user.role === Role.STUDENT) qb.andWhere('s.student_id = :id', { id: user.userId });
  if (user.role === Role.TEACHER) qb.andWhere('a.teacher_id = :id', { id: user.userId });
  if (activityId) qb.andWhere('s.activity_id = :activityId', { activityId });
  return qb.orderBy('s.id', 'DESC').getMany();
 }
 async update(id: number, dto: UpdateChatSessionDto, user: Principal) {
  const session = await this.assertAccess(id, user);
  if (user.role === Role.STUDENT && dto.status !== 'COMPLETED') throw new ForbiddenException('Student may only complete a session');
  if (dto.status) {
   session.status = dto.status;
   session.endedAt = dto.status === 'ACTIVE' ? null : new Date();
  }
  return this.repo.save(session);
 }
 async remove(id: number, user: Principal) {
  if (user.role !== Role.ADMIN) throw new ForbiddenException('Only admin may delete sessions');
  const session = await this.assertAccess(id, user);
  await this.repo.remove(session); return { deleted: true };
 }
}
