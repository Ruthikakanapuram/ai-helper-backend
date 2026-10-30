
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Activity } from '../activities/activity.entity';
import { Student } from '../students/entities/student.entity';

import { ChatSessionStatus } from '../common/enums/common.enum';

@Entity('chat_sessions')
@Index(
  'uq_chat_session_activity_student',
  ['activityId', 'studentId'],
  { unique: true },
)
@Index(
  'idx_chat_sessions_activity_status',
  ['activityId', 'status'],
)
export class ChatSession {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'activity_id',
    type: 'bigint',
    unsigned: true,
  })
  activityId: number;

  @ManyToOne(() => Activity, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({
    name: 'student_id',
    type: 'bigint',
    unsigned: true,
  })
  studentId: number;

  @ManyToOne(() => Student, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
  })
  student: Student;

  @Column({
    type: 'enum',
    enum: ChatSessionStatus,
    default: ChatSessionStatus.ACTIVE,
  })
  status: ChatSessionStatus;

  @CreateDateColumn({
    name: 'started_at',
    type: 'datetime',
    precision: 6,
  })
  startedAt: Date;

  @Column({
    name: 'ended_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  endedAt: Date | null;
}
