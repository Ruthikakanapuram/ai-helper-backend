
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { ActivitiesService } from './activities.service';

import {
  CreateActivityDto,
  UpdateActivityDto,
} from './dto/activity.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Principal } from '../common/guards/ownership';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {

  constructor(
    private readonly service: ActivitiesService,
  ) {}

  // Create new activity
  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  create(
    @Body() dto: CreateActivityDto,
    @Req() req: { user: Principal },
  ) {
    return this.service.create(dto, req.user);
  }

  // Get activities according to logged-in role
  @Get()
  findAll(
    @Req() req: { user: Principal },
  ) {
    return this.service.findAll(req.user);
  }

  // Get one activity
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: Principal },
  ) {
    return this.service.findOne(id, req.user);
  }

  // Update activity
  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
    @Req() req: { user: Principal },
  ) {
    return this.service.update(id, dto, req.user);
  }

  // Delete activity
  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: Principal },
  ) {
    return this.service.remove(id, req.user);
  }
}
