import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Activity } from '../activities/activity.entity';
import { User } from 'src/users/entities/user.entity';
@Entity('chat_sessions')
@Unique('uq_chat_sessions_activity_student_number', ['activityId','studentId','sessionNumber'])
@Index('idx_chat_sessions_activity_status', ['activityId','status'])
export class ChatSession {
 @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
 @Column({ name: 'activity_id', type: 'bigint', unsigned: true }) activityId: number;
 @ManyToOne(() => Activity, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'activity_id' }) activity: Activity;
 @Column({ name: 'student_id', type: 'bigint', unsigned: true }) studentId: number;
 @ManyToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'student_id' }) student: User;
 @Column({ name: 'session_number', type: 'int', unsigned: true, default: 1 }) sessionNumber: number;
 @Column({ type: 'enum', enum: ['ACTIVE','COMPLETED','EXPIRED','TERMINATED'], default: 'ACTIVE' }) status: string;
 @CreateDateColumn({ name: 'started_at', type: 'datetime', precision: 6 }) startedAt: Date;
 @Column({ name: 'ended_at', type: 'datetime', precision: 6, nullable: true }) endedAt: Date | null;
}
