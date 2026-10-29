
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateStudentDto } from './create-student.dto';

export class UpdateStudentDto extends PartialType(
  CreateStudentDto,
) {
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;
}
