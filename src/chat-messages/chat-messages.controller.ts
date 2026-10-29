import { SendChatDto } from './dto/send-chat.dto';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto, UpdateChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Principal } from '../common/guards/ownership';
@ApiTags('Chat Messages') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Controller('chat-messages')
export class ChatMessagesController {
 constructor(private service: ChatMessagesService) {}
 @Post('send') @Roles(Role.STUDENT) send(@Body() dto: SendChatDto, @Req() req: { user: Principal }) { return this.service.send(dto, req.user); }
 @Post() @Roles(Role.ADMIN, Role.STUDENT) create(@Body() dto: CreateChatMessageDto, @Req() req: { user: Principal }) { return this.service.create(dto, req.user); }
 @Get() @ApiQuery({ name: 'sessionId', required: true, type: Number })
 findAll(@Query('sessionId', ParseIntPipe) sessionId: number, @Req() req: { user: Principal }) { return this.service.findAll(req.user, sessionId); }
 @Get(':id') findOne(@Param('id', ParseIntPipe) id: number, @Req() req: { user: Principal }) { return this.service.findOne(id, req.user); }
 @Patch(':id') @Roles(Role.ADMIN) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChatMessageDto, @Req() req: { user: Principal }) { return this.service.update(id, dto, req.user); }
 @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id', ParseIntPipe) id: number, @Req() req: { user: Principal }) { return this.service.remove(id, req.user); }
}
