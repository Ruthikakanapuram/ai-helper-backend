import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './chat-session.entity';
import { ChatSessionsController } from './chat-sessions.controller';
import { ChatSessionsService } from './chat-sessions.service';
import { ActivitiesModule } from '../activities/activities.module';
import { Student } from 'src/students/entities/student.entity';
@Module({ imports: [TypeOrmModule.forFeature([ChatSession,Student]), ActivitiesModule], providers: [ChatSessionsService], controllers: [ChatSessionsController], exports: [ChatSessionsService] })
export class ChatSessionsModule {}
