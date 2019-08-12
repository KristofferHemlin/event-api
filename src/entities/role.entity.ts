import {Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import User from './user.entity';
import Permission from './permission.entity';

@Entity()
class Role {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;

  @Column()
  role: string;

  @OneToMany(type => User, user => user.company)
  users: User[];

  @OneToMany(type => Permission, permission => permission.roles)
  permissions: Permission[];
};

export default Role;
