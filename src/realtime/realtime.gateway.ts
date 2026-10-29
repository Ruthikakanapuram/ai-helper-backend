import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';
import { Role } from '../common/enums/role.enum';
import { Principal } from '../common/guards/ownership';

@Injectable()
@WebSocketGateway({ namespace: '/live', cors: { origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',') } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  constructor(private jwt: JwtService, private users: UsersService, private activities: ActivitiesService) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const raw = client.handshake.auth?.token || (typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : '');
      if (typeof raw !== 'string' || !raw) throw new UnauthorizedException();
      const payload = await this.jwt.verifyAsync<{ sub: number }>(raw);
      const user = await this.users.findOne(Number(payload.sub));
      if (user.status !== 'ACTIVE') throw new UnauthorizedException();
      client.data.principal = { userId: Number(user.id), role: user.role } as Principal;
    } catch {
      client.emit('auth_error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join_activity')
  async joinActivity(@ConnectedSocket() client: Socket, @MessageBody() body: { activityId: number }) {
    const user = client.data.principal as Principal | undefined;
    if (!user) throw new UnauthorizedException();
    if (user.role !== Role.ADMIN && user.role !== Role.TEACHER) throw new ForbiddenException('Teachers only');
    const id = Number(body?.activityId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new ForbiddenException('Invalid activity');
    await this.activities.requireOwner(id, user);
    await client.join(`activity:${id}`);
    return { event: 'joined_activity', data: { activityId: id } };
  }

  @SubscribeMessage('leave_activity')
  async leaveActivity(@ConnectedSocket() client: Socket, @MessageBody() body: { activityId: number }) {
    const id = Number(body?.activityId);
    if (Number.isSafeInteger(id) && id > 0) await client.leave(`activity:${id}`);
    return { event: 'left_activity', data: { activityId: id } };
  }

  publish(activityId: number, event: 'prompt_submitted' | 'response_completed' | 'response_failed', payload: object) {
    this.server.to(`activity:${activityId}`).emit(event, { activityId, ...payload });
  }
}
