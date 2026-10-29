import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';
@Module({
 imports: [UsersModule, ActivitiesModule, JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService],
  useFactory: (c: ConfigService) => ({ secret: c.getOrThrow<string>('JWT_SECRET') }) })],
 providers: [RealtimeGateway], exports: [RealtimeGateway]
})
export class RealtimeModule {}
