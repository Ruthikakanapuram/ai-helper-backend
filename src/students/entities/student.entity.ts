
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Year, Branch, Section } from 'src/common/enums/common.enum';
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'user_id',
    type: 'bigint',
    unsigned: true,
    unique: true,
  })
  userId: number;

  @Column({
    name: 'full_name',
    length: 150,
  })
  fullName: string;

  @Column({
    name: 'roll_number',
    length: 50,
    nullable: true,
    type: 'varchar',
  })
  rollNumber: string | null;

  @OneToOne(() => User, (user) => user.student, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;


@Column({
  name: 'year',
  type: 'enum',
  enum: Year,
})
year: Year;

@Column({
  name: 'branch',
  type: 'enum',
  enum: Branch,
})
branch: Branch;

@Column({
  name:'section',
  type:'enum',
  enum: Section
})
section: Section
  
}
