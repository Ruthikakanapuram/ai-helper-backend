import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
@Entity('activities')
@Index('idx_activities_teacher_status', ['teacherId','status'])
export class Activity {
 @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
 @Column({ name: 'teacher_id', type: 'bigint', unsigned: true }) teacherId: number;
 @ManyToOne(() => User, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'teacher_id' }) teacher: User;
 @Column({ length: 255 }) title: string;
 @Column({ length: 255 }) topic: string;
 @Column({ type: 'text', nullable: true }) description: string | null;
 @Column({ type: 'text', nullable: true }) instructions: string | null;
 @Column({ type: 'enum', enum: ['DRAFT','PUBLISHED','CLOSED','ARCHIVED'], default: 'DRAFT' }) status: string;
 @Column({ name: 'starts_at', type: 'datetime', precision: 6, nullable: true }) startsAt: Date | null;
 @Column({ name: 'ends_at', type: 'datetime', precision: 6, nullable: true }) endsAt: Date | null;
 @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 }) createdAt: Date;
 @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 }) updatedAt: Date;
}
