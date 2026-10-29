import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
export class SendChatDto {
 @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) sessionId: number;
 @ApiProperty({ example: 'What is a binary tree?' }) @IsString() @MaxLength(30000) prompt: string;
 @ApiProperty({ description: 'Unique UUID per student prompt, reuse on retry', format: 'uuid' }) @IsUUID() clientRequestId: string;
}
