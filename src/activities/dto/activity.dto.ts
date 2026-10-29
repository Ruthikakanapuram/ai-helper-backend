import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateActivityDto {
 @ApiProperty() @IsString() @MaxLength(255) title: string;
 @ApiProperty() @IsString() @MaxLength(255) topic: string;
 @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
 @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
 @ApiPropertyOptional({ enum: ['DRAFT','PUBLISHED','CLOSED','ARCHIVED'] }) @IsOptional() @IsEnum(['DRAFT','PUBLISHED','CLOSED','ARCHIVED']) status?: string;
 @ApiPropertyOptional({ example: '2026-11-01T09:00:00Z' }) @IsOptional() @IsDateString() startsAt?: string;
 @ApiPropertyOptional({ example: '2026-11-01T10:00:00Z' }) @IsOptional() @IsDateString() endsAt?: string;
}
export class UpdateActivityDto {
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) title?: string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) topic?: string;
 @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
 @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
 @ApiPropertyOptional({ enum: ['DRAFT','PUBLISHED','CLOSED','ARCHIVED'] }) @IsOptional() @IsEnum(['DRAFT','PUBLISHED','CLOSED','ARCHIVED']) status?: string;
 @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
 @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
}
