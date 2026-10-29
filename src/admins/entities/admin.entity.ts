
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';

@Entity('admins')
export class Admin {
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

  @OneToOne(() => User, (user) => user.admin, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
