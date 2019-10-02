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

  @Column({ nullable: true })
  profileImageUrl: string;  

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
  signupComplete: boolean;

  @Column({ nullable: true })
  companyDepartment: string;

  @Column({ nullable: true })
  aboutMe: string;

  @Column({ nullable: true })
  allergiesOrPreferences: string;

  @Column()
  isActive: boolean;

  @Column({ select: false })  
  password: string;

  @ManyToOne(type => Role, role => role.users, {cascade: true})
  role: Role;

  @ManyToOne(type => Company, company => company.employees, {cascade: true})
  company: Company;

  @ManyToMany(type => Event, event => event.participants, {cascade: true})
  @JoinTable()
  events: Event[];

  @ManyToMany(type => Activity, activity => activity.participants)
  @JoinTable()
  activities: Activity[];

}

export default User;
