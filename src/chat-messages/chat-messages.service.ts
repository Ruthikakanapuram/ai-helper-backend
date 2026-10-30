import { AiService } from '../ai/ai.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SendChatDto } from './dto/send-chat.dto';
import { ConflictException } from '@nestjs/common';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { CreateChatMessageDto, UpdateChatMessageDto } from './dto/chat-message.dto';
import { ChatSessionsService } from '../chat-sessions/chat-sessions.service';
import { Principal } from '../common/guards/ownership';
import { Role } from '../common/enums/role.enum';
import { StudentsService } from 'src/students/students.service';
@Injectable()
export class ChatMessagesService {
 constructor(@InjectRepository(ChatMessage) private repo: Repository<ChatMessage>, private sessions: ChatSessionsService, private ai: AiService, private realtime: RealtimeGateway, private studentService: StudentsService) {}
 // Demonstration per-session serialization (single NestJS process only).
 // For multiple replicas replace with a durable distributed per-session queue.
 private readonly queues = new Map<number, Promise<unknown>>();
 async send(dto: SendChatDto, user: Principal) {
  if (user.role !== Role.STUDENT) throw new ForbiddenException('Student account required');
  const sid = dto.sessionId;
  const preceding = this.queues.get(sid) ?? Promise.resolve();
  const task = preceding.catch(() => undefined).then(() => this.processSend(dto, user));
  const tail = task.then(() => undefined, () => undefined);
  this.queues.set(sid, tail);
  void tail.then(() => { if (this.queues.get(sid) === tail) this.queues.delete(sid); });
  return task;
 }

 private async processSend(dto: SendChatDto, user: Principal) {
  const session = await this.sessions.assertAccess(dto.sessionId, user);
  const studentData= await this.studentService.findByUser(user.userId);
  if (session.studentId !== studentData.data?.id) throw new ForbiddenException('Not your chat session');
  if (session.status !== 'ACTIVE' || session.activity.status !== 'PUBLISHED')
   throw new BadRequestException('Session or activity not active');

  const existing = await this.repo.findOneBy({ sessionId: dto.sessionId, clientRequestId: dto.clientRequestId });
  if (existing) {
   if (existing.prompt !== dto.prompt) throw new ConflictException('Request UUID already used for different prompt');
   return existing;
  }
  const last = await this.repo.findOne({ where: { sessionId: dto.sessionId }, order: { turnNumber: 'DESC' } });
  // Keep all user messages and AI responses in the same row.
  const message = await this.repo.save(this.repo.create({
   sessionId: dto.sessionId, turnNumber: (last?.turnNumber ?? 0) + 1,
   clientRequestId: dto.clientRequestId, prompt: dto.prompt, response: null,
   status: 'PROCESSING', model: this.ai.model
  }));
  this.realtime.publish(session.activityId, 'prompt_submitted', {
   studentId: user.userId, sessionId: dto.sessionId, messageId: message.id,
   turnNumber: message.turnNumber, prompt: message.prompt, status: message.status,
   createdAt: message.createdAt
  });
  const previous = await this.repo.findOne({
   where: { sessionId: dto.sessionId, status: 'COMPLETED' }, order: { turnNumber: 'DESC' }
  });
  const start = Date.now();
  try {
   const result = await this.ai.generate(dto.prompt, previous?.openaiResponseId ?? undefined);
   message.response = result.text;
   message.openaiResponseId = result.responseId;
   message.inputTokens = result.inputTokens;
   message.outputTokens = result.outputTokens;
   message.latencyMs = Date.now() - start;
   message.status = 'COMPLETED';
   message.completedAt = new Date();
   const saved = await this.repo.save(message);
   this.realtime.publish(session.activityId, 'response_completed', {
    studentId: user.userId, sessionId: dto.sessionId, messageId: saved.id,
    turnNumber: saved.turnNumber, response: saved.response, status: saved.status,
    latencyMs: saved.latencyMs, completedAt: saved.completedAt
   });
   return saved;
  } catch (e) {
   message.status = 'FAILED';
   message.errorMessage = e instanceof Error ? e.message.slice(0, 1000) : 'Unknown provider error';
   message.completedAt = new Date();
   await this.repo.save(message);
   this.realtime.publish(session.activityId, 'response_failed', {
    studentId: user.userId, sessionId: dto.sessionId, messageId: message.id,
    status: 'FAILED', completedAt: message.completedAt
   });
   throw new BadRequestException('AI response failed; request recorded as FAILED');
  }
 }

 async create(dto: CreateChatMessageDto, user: Principal) {
  const session = await this.sessions.assertAccess(dto.sessionId, user);
  if (user.role === Role.TEACHER) throw new ForbiddenException('Teachers cannot submit student prompts');
  if (session.status !== 'ACTIVE') throw new BadRequestException('Session is not active');
  // This endpoint stores the prompt; the future OpenAI worker will fill the response in the same row.
  return this.repo.save(this.repo.create({ ...dto, status: 'PENDING' }));
 }

 
async getChatHistory(
  sessionId: number,
  user: Principal,
) {
  // Step 1: Verify that the requesting user
  // is allowed to access this session.
  const session = await this.sessions.assertAccess(
    sessionId,
    user,
  );

  // Step 2: Retrieve all conversation turns.
  // No status filter: include historical messages
  // from ACTIVE, COMPLETED, EXPIRED and
  // TERMINATED sessions.
  const messages = await this.repo.find({
    where: {
      sessionId: session.id,
    },
    order: {
      turnNumber: 'ASC',
      id: 'ASC',
    },
  });

  // Step 3: Return only the fields needed
  // for the chat history interface.
  return {
    session: {
      id: String(session.id),
      activityId: String(session.activityId),
      studentId: String(session.studentId),
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    },

    messages: messages.map((message) => ({
      id: String(message.id),
      sessionId: String(message.sessionId),
      turnNumber: message.turnNumber,

      prompt: message.prompt,
      response: message.response,

      status: message.status,

      createdAt: message.createdAt,
      completedAt: message.completedAt,
    })),
  };
}

 async findAll(user: Principal, sessionId: number) {
  await this.sessions.assertAccess(sessionId, user);
  return this.repo.find({ where: { sessionId }, order: { turnNumber: 'ASC' } });
 }
 async findOne(id: number, user: Principal) {
  const msg = await this.repo.findOneBy({ id });
  if (!msg) throw new NotFoundException('Message not found');
  await this.sessions.assertAccess(msg.sessionId, user);
  return msg;
 }
 async update(id: number, dto: UpdateChatMessageDto, user: Principal) {
  if (user.role !== Role.ADMIN) throw new ForbiddenException('Only admin can manually edit AI responses');
  const msg = await this.findOne(id, user);
  Object.assign(msg, dto);
  if (dto.status === 'COMPLETED') {
   if (!msg.response) throw new BadRequestException('A completed message requires a response');
   msg.completedAt = new Date();
  }
  return this.repo.save(msg);
 }
 async remove(id: number, user: Principal) {
  if (user.role !== Role.ADMIN) throw new ForbiddenException('Only admin can delete messages');
  const msg = await this.findOne(id, user);
  await this.repo.remove(msg);
  return { deleted: true };
 }
}
