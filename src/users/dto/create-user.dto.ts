
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'rahul123' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Rahul Kumar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({ example: 'CSE001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rollNumber?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
