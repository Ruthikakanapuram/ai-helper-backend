import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ChatSession } from '../chat-sessions/chat-session.entity';
@Entity('chat_messages')
@Unique('uq_message_session_turn', ['sessionId', 'turnNumber'])
@Unique('uq_message_session_request', ['sessionId', 'clientRequestId'])
@Index('idx_message_session_created', ['sessionId','createdAt'])
export class ChatMessage {
 @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
 @Column({ name: 'session_id', type: 'bigint', unsigned: true }) sessionId: number;
 @ManyToOne(() => ChatSession, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'session_id' }) session: ChatSession;
 @Column({ name: 'turn_number', type: 'int', unsigned: true }) turnNumber: number;
 @Column({ name: 'client_request_id', type: 'varchar', length: 36 }) clientRequestId: string;
 @Column({ type: 'mediumtext' }) prompt: string;
 @Column({ type: 'mediumtext', nullable: true }) response: string | null;
 @Column({ type: 'enum', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' }) status: string;
 @Column({ type: 'varchar', length: 100, nullable: true }) model: string | null;
 @Column({ name: 'openai_response_id', type: 'varchar', length: 191, nullable: true, unique: true }) openaiResponseId: string | null;
 @Column({ name: 'input_tokens', type: 'int', unsigned: true, nullable: true }) inputTokens: number | null;
 @Column({ name: 'output_tokens', type: 'int', unsigned: true, nullable: true }) outputTokens: number | null;
 @Column({ name: 'latency_ms', type: 'int', unsigned: true, nullable: true }) latencyMs: number | null;
 @Column({ name: 'error_message', type: 'text', nullable: true }) errorMessage: string | null;
 @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 }) createdAt: Date;
 @Column({ name: 'completed_at', type: 'datetime', precision: 6, nullable: true }) completedAt: Date | null;
}
