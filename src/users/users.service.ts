import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource,Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';
import { Student } from 'src/students/entities/student.entity';
@Injectable()
export class UsersService {
 constructor(
  @InjectRepository(User) private repo: Repository<User>,
      private readonly dataSource: DataSource,


) {}
 async create(dto: CreateUserDto, allowRole = false): Promise<User> {
  if (await this.repo.findOneBy({ username: dto.username.toLowerCase() })) throw new ConflictException('username already registered');
  const user = this.repo.create({  username: dto.username.toLowerCase(),
    passwordHash: await bcrypt.hash(dto.password, 12), role: allowRole ? (dto.role || Role.STUDENT) : Role.STUDENT });
  return this.repo.save(user);
 }
//  async create(
//     dto: CreateUserDto,
//     allowRole = false,
//   ): Promise<User> {
//     const username = dto.username.trim().toLowerCase();

//     // Check duplicate username
//     const existingUser = await this.repo.findOneBy({
//       username,
//     });

//     if (existingUser) {
//       throw new ConflictException(
//         'Username already registered',
//       );
//     }

//     // Never let public registration assign privileged roles
//     const role = allowRole
//       ? (dto.role ?? Role.STUDENT)
//       : Role.STUDENT;

//     const passwordHash = await bcrypt.hash(
//       dto.password,
//       12,
//     );

//     // Create User and Student in one transaction
//     try {
//       return await this.dataSource.transaction(
//         async (manager) => {

//           // Step 1: Create User
//           const user = manager.create(User, {
//             username,
//             passwordHash,
//             role,
//             status: 'ACTIVE',
//           });

//           const savedUser = await manager.save(
//             User,
//             user,
//           );

//           // Step 2: Create Student profile only
//           // when the user has STUDENT role
//           if (savedUser.role === Role.STUDENT) {
//             const student = manager.create(Student, {
//               userId: savedUser.id,
//               fullName: dto.fullName,
//               rollNumber: dto.rollNumber ?? null,
//             });

//             await manager.save(Student, student);
//           }

//           // Exclude password hash from return value
//           delete (savedUser as Partial<User>).passwordHash;

//           return savedUser;
//         },
//       );
//     } catch (error) {
//       // MySQL duplicate-key error
//       if (
//         typeof error === 'object' &&
//         error !== null &&
//         'driverError' in error &&
//         (error as any).driverError?.code === 'ER_DUP_ENTRY'
//       ) {
//         throw new ConflictException(
//           'Username already registered',
//         );
//       }

//       throw error;
//     }
//   }
 findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
 async findOne(id: number) { const user = await this.repo.findOneBy({ id }); if (!user) throw new NotFoundException('User not found'); return user; }
 findByUsername(username: string) { return this.repo.findOneBy({ username: username.toLowerCase() }); }
 async update(id: number, dto: UpdateUserDto) {
  const user = await this.findOne(id);
  if (dto.username && dto.username.toLowerCase() !== user.username) {
   const existing = await this.findByUsername(dto.username);
   if (existing) throw new ConflictException('Email already registered');
  }
  if (dto.username !== undefined) user.username = dto.username.toLowerCase();
  if (dto.password !== undefined) user.passwordHash = await bcrypt.hash(dto.password, 12);
  if (dto.role !== undefined) user.role = dto.role;
  if (dto.status !== undefined) user.status = dto.status;
  return this.repo.save(user);
 }
 async remove(id: number) { const user = await this.findOne(id); await this.repo.remove(user); return { deleted: true }; }
}
