
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Branch, Section, Year } from 'src/common/enums/common.enum';

export class CreateStudentDto {
  @ApiProperty({
    example: 'rahul123',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'StrongPass123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'Rahul Kumar',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({
    example: 'CSE001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rollNumber?: string;

   @IsEnum(Year)
  year: Year;

  @IsEnum(Branch)
  branch: Branch;

  @IsEnum(Section)
  section: Section;
}

export class CreateStudentsBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentDto)
  students: CreateStudentDto[];
}