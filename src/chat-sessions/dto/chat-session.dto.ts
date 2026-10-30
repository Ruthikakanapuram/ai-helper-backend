
import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiProperty({
    example: 1,
    description: 'Activity ID',
  })
  @IsInt()
  @Min(1)
  activityId: number;

  // Optional: Admin can create a session
  // for a specific Student profile.
  @ApiPropertyOptional({
    example: 10,
    description: 'Student profile ID, not User ID',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  studentId?: number;
}

// If your existing controller uses UpdateChatSessionDto,
// preserve the export for compatibility.
export class UpdateChatSessionDto extends PartialType(
  CreateChatSessionDto,
) {}
