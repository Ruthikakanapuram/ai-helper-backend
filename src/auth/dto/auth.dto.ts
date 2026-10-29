import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
export class RegisterDto {
 @ApiProperty() @IsString() @MaxLength(150) fullName: string;
 @ApiProperty() username: string;
 @ApiProperty() @IsString() @MinLength(8) password: string;
}
export class LoginDto {
 @ApiProperty() @IsString() username: string;
 @ApiProperty() @IsString() password: string;
}
