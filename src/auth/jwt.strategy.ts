import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
 constructor(config: ConfigService, private users: UsersService) {
  super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false,
   secretOrKey: config.getOrThrow<string>('JWT_SECRET') });
 }
 async validate(payload: { sub: number }) {
  const user = await this.users.findOne(payload.sub);
  if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account disabled');
  return { userId: user.id, role: user.role };
 }
}
