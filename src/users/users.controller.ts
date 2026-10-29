import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { requireSelfOrAdmin, Principal } from '../common/guards/ownership';
@ApiTags('Users') 
// @ApiBearerAuth() 
// @UseGuards(JwtAuthGuard, RolesGuard)
// @UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
 constructor(private service: UsersService) {}
 @Post() 
//  @Roles(Role.ADMIN)
create(@Body() dto: CreateUserDto) { return this.service.create(dto, true); }
 @Get() @Roles(Role.ADMIN) findAll() { return this.service.findAll(); }
 @Get(':id') findOne(@Param('id', ParseIntPipe) id: number, @Req() req: { user: Principal }) { requireSelfOrAdmin(req.user, id); return this.service.findOne(id); }
 @Patch(':id') @Roles(Role.ADMIN) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) { return this.service.update(id, dto); }
 @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
