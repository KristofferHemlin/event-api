import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import User from './user.entity';
import Event from './event.entity';

@Entity()
class Company {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;

  @Column()
  title: string;

  @OneToMany(type => User, user => user.company)
  employees: User[];

  @OneToMany(type => Event, event => event.company)
  events: Event[];

}

export default Company;
