
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsIn,
  Matches,
  MaxLength,
   IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsInt,
  Min,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';

import {
  ActivityDuration,
  ActivityStatus,
} from  '../../common/enums/common.enum'

export class CreateActivityDto {

  @ApiProperty({
    example: 'Learning Regression',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
  example: 'Regression',
  description: 'Optional topic for the activity',
})
@IsOptional()
@IsString()
@MaxLength(255)
topic?: string;

  @ApiPropertyOptional({
    example: 'Regression in Machine Learning',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: [20, 30, 45],
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsEnum(ActivityDuration)
  duration?: ActivityDuration;

  @ApiProperty({
    example: '2026-11-01',
    description: 'Scheduled date in YYYY-MM-DD format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'scheduledDate must use YYYY-MM-DD format',
  })
  scheduledDate: string;

  @ApiPropertyOptional({
    enum: ActivityStatus,
  })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
  @ApiProperty({
  example: [1, 2, 3],
  description: 'IDs from the students table to assign to this activity',
  type: [Number],
})
@IsArray()
@ArrayNotEmpty()
@ArrayUnique()
@IsInt({ each: true })
@Min(1, { each: true })
studentIds: number[];
}

export class UpdateActivityDto extends PartialType(
  CreateActivityDto,
) {}


export class UpdateActivityStatusDto {
  @ApiProperty({
    enum: ['PUBLISHED', 'CLOSED'],
    example: 'PUBLISHED',
  })
  @IsIn([
    ActivityStatus.PUBLISHED,
    ActivityStatus.CLOSED,
  ])
  status: ActivityStatus;
}