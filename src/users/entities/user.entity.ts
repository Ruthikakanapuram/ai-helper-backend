import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { Exclude } from 'class-transformer';
import { Teacher } from 'src/teachers/entities/teacher.entity';
import { Student } from 'src/students/entities/student.entity';
import { Admin } from 'src/admins/entities/admin.entity';

@Entity('users')
export class User {
 @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
 @Column({ unique: true, length: 255 }) username: string;
 @Exclude() @Column({ name: 'password_hash', length: 255 }) passwordHash: string;
 @Column({ type: 'enum', enum: Role, default: Role.STUDENT }) role: Role;
 @Column({ type: 'enum', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' }) status: string;
 @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 }) createdAt: Date;
 @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 }) updatedAt: Date;
 @OneToOne(() => Student, (student) => student.user)
  student?: Student;

  @OneToOne(() => Teacher, (teacher) => teacher.user)
  teacher?: Teacher;

  @OneToOne(() => Admin, (admin) => admin.user)
  admin?: Admin;
}
