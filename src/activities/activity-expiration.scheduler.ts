
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivitiesService } from './activities.service';

@Injectable()
export class ActivityExpirationScheduler {
  private readonly logger = new Logger(
    ActivityExpirationScheduler.name,
  );

  private isRunning = false;

  constructor(
    private readonly activitiesService: ActivitiesService,
  ) {}

  // Execute every 5 seconds
  @Cron('*/5 * * * * *')
  async handleExpiration(): Promise<void> {
    // Prevent overlapping executions
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      await this.activitiesService.closeExpiredActivities();
    } catch (error) {
      this.logger.error(
        'Failed to expire activities',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      // Always release the lock
      this.isRunning = false;
    }
  }
}
