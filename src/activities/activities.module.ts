import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityExpirationScheduler } from './activity-expiration.scheduler';
@Module({ imports: [TypeOrmModule.forFeature([Activity])], controllers: [ActivitiesController], providers: [ActivitiesService, ActivityExpirationScheduler,
], exports: [ActivitiesService] })
export class ActivitiesModule {}
