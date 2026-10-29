import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
@Injectable()
export class AuthService {
 constructor(private users: UsersService, private jwt: JwtService) {}
 async register(dto: RegisterDto) {
  const user = await this.users.create(dto);
  return { id: user.id, username: user.username, role: user.role };
 }
 async login(dto: LoginDto) {
  const user = await this.users.findByUsername(dto.username);
  if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(dto.password, user.passwordHash)))
   throw new UnauthorizedException('Invalid credentials');
  return { access_token: await this.jwt.signAsync({ sub: user.id, role: user.role }), token_type: 'Bearer' };
 }
}
