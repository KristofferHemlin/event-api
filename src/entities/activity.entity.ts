import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  OneToMany,
} from 'typeorm'

import Event from './event.entity';
import User from './user.entity';
import Company from './company.entity';
import ActivityUpdateLog from './activitylog.entity';

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

  @Column({type: "timestamp"})
  startTime: Date;

  @Column({type: "timestamp"})
  endTime: Date;

  @Column()
  location: string;

  @Column({nullable: true})
  coverImageUrl: string;

  @Column({nullable: true})
  goodToKnow: string;

  @OneToMany(type => ActivityUpdateLog, activityLog => activityLog.activity)
  updateLogs: ActivityUpdateLog[]

  @ManyToOne(type => Event, event => event.activities)
  event: Event;

  @ManyToMany(type => User, user => user.activities)
  participants: User[];

  @ManyToOne(type => Company, company => company.activities, {cascade: true})
  company: Company;
}

export default Activity;
