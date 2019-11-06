import {Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import User from './user.entity';

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

  @OneToMany(type => User, user => user.role)
  users: User[];

};

export default Role;
