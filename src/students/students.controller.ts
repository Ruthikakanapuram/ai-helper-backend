
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { StudentsService } from './students.service';
import { CreateStudentDto, CreateStudentsBulkDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { requireSelfOrAdmin, Principal } from '../common/guards/ownership';
import { Branch, Section, Year } from '../common/enums/common.enum';
@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
  ) {}

  @Post('bulk-students')
  @Roles(Role.ADMIN, Role.TEACHER)
  createBulk(@Body() dto: CreateStudentsBulkDto) {
    return this.studentsService.createBulk(dto);
  }

 @Get()
@Roles(Role.ADMIN, Role.TEACHER)
findAll(
  @Query('branch') branch?: Branch,
  @Query('year') year?: Year,
  @Query('section') section?: Section,
) {
  return this.studentsService.findAll({ branch, year, section });
}

  // @Get(':id')
  // @Roles(Role.ADMIN, Role.TEACHER)
  // findOne(@Param('id', ParseIntPipe) id: number,@Req() req: { user: Principal }) {
  //   requireSelfOrAdmin(req.user, id);
  //   return this.studentsService.findOne(id);
  // }

  // @Patch(':id')
  // @Roles(Role.ADMIN)
  // update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateStudentDto,
  // ) {
  //   return this.studentsService.update(id, dto);
  // }

  // @Delete(':id')
  // @Roles(Role.ADMIN)
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.studentsService.remove(id);
  // }
}
