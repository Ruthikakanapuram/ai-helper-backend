import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';
export type Principal = { userId: number; role: Role };
export function requireSelfOrAdmin(user: Principal, id: number) {
 if (user.role !== Role.ADMIN && user.userId !== id) throw new ForbiddenException('Not allowed');
}
