import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatSessionsService } from './chat-sessions.service';
import { CreateChatSessionDto, UpdateChatSessionDto } from './dto/chat-session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Principal } from '../common/guards/ownership';
@ApiTags('Chat Sessions') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('chat-sessions')
export class ChatSessionsController {
 constructor(private service: ChatSessionsService) {}
 @Post() @Roles(Role.ADMIN, Role.STUDENT) create(@Body() dto: CreateChatSessionDto, @Req() req: { user: Principal }) { return this.service.create(dto, req.user); }
 @Get() findAll(@Req() req: { user: Principal }, @Query('activityId') activityId?: string) { return this.service.findAll(req.user, activityId ? Number(activityId) : undefined); }
 @Get(':id') findOne(@Param('id', ParseIntPipe) id: number, @Req() req: { user: Principal }) { return this.service.assertAccess(id, req.user); }
//  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChatSessionDto, @Req() req: { user: Principal }) { return this.service.update(id, dto, req.user); }
 @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user: Principal }) { return this.service.remove(id, req.user); }
}
