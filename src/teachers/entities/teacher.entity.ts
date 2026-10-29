
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';

@Entity('teachers')
export class Teacher {
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
  type: 'varchar',
  length: 150,
  nullable: true,
})
department: string | null;

  @OneToOne(() => User, (user) => user.teacher, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
