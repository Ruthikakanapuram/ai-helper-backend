
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { ActivityDuration, ActivityStatus } from 'src/common/enums/common.enum';


@Entity('activities')
@Index('idx_activities_teacher_id', ['teacherId'])
@Index('idx_activities_teacher_status', ['teacherId', 'status'])
export class Activity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'teacher_id',
    type: 'bigint',
    unsigned: true,
  })
  teacherId: number;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255 })
  topic: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  // Duration in minutes: 20, 30, or 45
  @Column({
    name: 'duration',
    type: 'smallint',
    unsigned: true,
    default: ActivityDuration.THIRTY_MINUTES,
  })
  duration: ActivityDuration;

  // Scheduled date: YYYY-MM-DD
  @Column({
    name: 'scheduled_date',
    type: 'date',
    nullable: true,
  })
  scheduledDate: string | null;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.SCHEDULED,
  })
  status: ActivityStatus;
  @Column({
  name: 'started_at',
  type: 'datetime',
  precision: 6,
  nullable: true,
})
startedAt: Date | null;

@Column({
  name: 'ended_at',
  type: 'datetime',
  precision: 6,
  nullable: true,
})
endedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
  })
  updatedAt: Date;

}
