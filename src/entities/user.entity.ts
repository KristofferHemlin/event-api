import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';

import Company from './company.entity';
import Role from './role.entity';
import Account from './account.entity'; // FIXME: Might be deprecated...
import Event from './event.entity';
import Activity from './activity.entity';

@Entity()
class User {

  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;

  @Column({
    length: 100,
  })
  firstName: string;

  @Column({
    length: 100
  })
  lastName: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  isActive: boolean;

  @OneToOne(type => Account)
  account: Account;

  @ManyToOne(type => Role, role => role.users)
  role: Role;

  @ManyToOne(type => Company, company => company.employees, {cascade: true})
  company: Company;

  @ManyToMany(type => Event, event => event.participants)
  @JoinTable()
  events: Event[];

  @ManyToMany(type => Activity, activity => activity.participants)
  @JoinTable()
  activities: Activity[];

}

export default User;
