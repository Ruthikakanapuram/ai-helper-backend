import { AiModule } from './ai/ai.module';
import { RealtimeModule } from './realtime/realtime.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { ChatSessionsModule } from './chat-sessions/chat-sessions.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { AdminsModule } from './admins/admins.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        timezone: 'Z',
        extra: { connectionLimit: 10 },
      }),
    }),
    UsersModule, AuthModule, ActivitiesModule, ChatSessionsModule, ChatMessagesModule, AiModule, RealtimeModule, StudentsModule, TeachersModule, AdminsModule,
  ],
})
export class AppModule {}
