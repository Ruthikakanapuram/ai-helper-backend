import { AiModule } from '../ai/ai.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessagesService } from './chat-messages.service';
import { ChatSessionsModule } from '../chat-sessions/chat-sessions.module';
import { StudentsModule } from 'src/students/students.module';
@Module({ imports: [TypeOrmModule.forFeature([ChatMessage]), ChatSessionsModule, AiModule, RealtimeModule,StudentsModule], providers: [ChatMessagesService], controllers: [ChatMessagesController] })
export class ChatMessagesModule {}
