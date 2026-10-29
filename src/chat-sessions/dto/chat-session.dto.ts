import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateChatSessionDto {
 @ApiProperty() @Type(() => Number) @IsInt() @Min(1) activityId: number;
 @ApiPropertyOptional({ description: 'Admin only: select a student. Normally determined from JWT.' }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) studentId?: number;
 @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) sessionNumber?: number;
}
export class UpdateChatSessionDto {
 @ApiPropertyOptional({ enum: ['ACTIVE','COMPLETED','EXPIRED','TERMINATED'] })
 @IsOptional() @IsEnum(['ACTIVE','COMPLETED','EXPIRED','TERMINATED']) status?: string;
}
