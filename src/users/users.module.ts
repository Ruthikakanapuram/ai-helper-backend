import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Student } from 'src/students/entities/student.entity';
import { Admin } from 'src/admins/entities/admin.entity';
@Module({ imports: [TypeOrmModule.forFeature([User,Teacher, Student, Admin])], providers: [UsersService], controllers: [UsersController], exports: [UsersService] })
export class UsersModule {}
