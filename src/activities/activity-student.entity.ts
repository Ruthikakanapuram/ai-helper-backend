import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

import { Activity } from './activity.entity';
import { Student } from '../students/entities/student.entity';

@Entity('activity_students')
@Unique('UQ_activity_student', ['activityId', 'studentId'])
@Index('IDX_activity_students_student', ['studentId'])
export class ActivityStudent {
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

  @Column({
    name: 'student_id',
    type: 'bigint',
    unsigned: true,
  })
  studentId: number;

  @ManyToOne(() => Activity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => Student, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
  })
  createdAt: Date;
}