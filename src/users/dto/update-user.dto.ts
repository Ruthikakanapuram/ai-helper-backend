import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';
export class UpdateUserDto {
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) fullName?: string;
 @ApiPropertyOptional() @IsOptional()  username?: string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(8) password?: string;
 @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;
 @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }) @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED']) status?: string;
}
