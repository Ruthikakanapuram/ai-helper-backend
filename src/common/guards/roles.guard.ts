import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
@Injectable()
export class RolesGuard implements CanActivate {
 constructor(private reflector: Reflector) {}
 canActivate(ctx: ExecutionContext): boolean {
  const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
  if (!roles?.length) return true;
  return roles.includes(ctx.switchToHttp().getRequest().user?.role);
 }
}
