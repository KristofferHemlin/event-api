import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

import Company from './company.entity';
import User from './user.entity';
import Activity from './activity.entity';

@Entity()
class Event {

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

  @Column({type: "timestamp"})
  startTime: Date;

  @Column({type: "timestamp"})
  endTime: Date;

  @Column()
  location: string;

  @Column({nullable: true})
  coverImageUrl: string;

  @ManyToOne(type => Company, company => company.events)
  company: Company;

  @ManyToMany(type => User, user => user.events)
  participants: User[];

  @OneToMany(type => Activity, activity => activity.event)
  activities: Activity[];

}

export default Event;
