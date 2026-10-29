import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

import { Student } from './entities/student.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { CreateStudentsBulkDto } from './dto/create-student.dto';
import { Branch, Section, Year } from 'src/common/enums/common.enum';

@Injectable()
export class StudentsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async createBulk(dto: CreateStudentsBulkDto) {
    console.log("studentbulk", dto)
    if (!dto.students?.length) {
      throw new BadRequestException(
        'At least one student is required',
      );
    }

    // Prevent duplicate usernames within the uploaded list.
    const usernames = dto.students.map((student) =>
      student.username.trim(),
    );

    if (new Set(usernames).size !== usernames.length) {
      throw new ConflictException(
        'The uploaded list contains duplicate usernames',
      );
    }

    // Check for existing usernames before starting the transaction.
    const existingUsers = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.username'])
      .where('user.username IN (:...usernames)', { usernames })
      .getMany();

    if (existingUsers.length > 0) {
      throw new ConflictException({
        message: 'Some usernames already exist',
        usernames: existingUsers.map((user) => user.username),
      });
    }

    try {
      return await this.dataSource.transaction(
        async (manager) => {
          const userRepo = manager.getRepository(User);
          const studentRepo = manager.getRepository(Student);

          const createdStudents: {
            id: number;
            userId: number;
            username: string;
            fullName: string;
            rollNumber: string | null;
            year: Year;
            branch: Branch;
            section: Section;
            temporaryPassword: string;
          }[] = [];

          for (const row of dto.students) {

  // Generate password from username
  const username = row.username.trim();
  const temporaryPassword = `${username}123`;

  // Hash password before saving
  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    12,
  );

  // Create user account
  const user = userRepo.create({
    username,
    passwordHash,
    role: Role.STUDENT,
    status: 'ACTIVE',
  });

  const savedUser = await userRepo.save(user);

  // Create student profile
  const student = studentRepo.create({
    userId: savedUser.id,
    fullName: row.fullName.trim(),
    rollNumber: row.rollNumber?.trim() || null,
    year: row.year,
    branch: row.branch,
    section: row.section,
  });

  const savedStudent = await studentRepo.save(student);

  createdStudents.push({
    id: savedStudent.id,
    userId: savedUser.id,
    username: savedUser.username,
    fullName: savedStudent.fullName,
    rollNumber: savedStudent.rollNumber,
    year: savedStudent.year,
    branch: savedStudent.branch,
    section: savedStudent.section,
    temporaryPassword,
  });
}

          return {
            message: 'Students created successfully',
            count: createdStudents.length,
            students: createdStudents,
          };
        },
      );
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create students. No records were committed.',
      );

    }
  }
}