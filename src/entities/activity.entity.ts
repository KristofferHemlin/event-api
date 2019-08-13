import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm'

import Event from './event.entity';
import User from './user.entity';
import Company from './company.entity';

@Entity()
class Activity {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(type => Event, event => event.activities)
  event: Event;

  @ManyToMany(type => User, user => user.activities)
  participants: User[];

  @ManyToOne(type => Company, company => company.activities, {cascade: true})
  company: Company;
}

export default Activity;
