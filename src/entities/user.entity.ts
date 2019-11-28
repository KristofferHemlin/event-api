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
  Unique
} from "typeorm";

import Company from "./company.entity";
import Role from "./role.entity";
import Event from "./event.entity";
import Activity from "./activity.entity";
import PlayerId from "./playerId.entity";

@Entity()
@Unique(["email"])
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({
    length: 100
  })
  firstName: string;

  @Column({
    length: 100
  })
  lastName: string;

  @Column({ nullable: true })
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

  @Column({ select: false })
  isActive: boolean;

  @Column({ select: false })
  password: string;

  @Column({ select: false, nullable: true })
  resetPwdToken: string;

  @Column({ select: false, nullable: true, type: "timestamp" })
  resetPwdExpireAt: Date;

  @Column({ select: false, nullable: true })
  refreshToken: string;

  @ManyToOne(
    type => Role,
    role => role.users,
    { cascade: true, nullable: false }
  )
  role: Role;

  @ManyToOne(
    type => Company,
    company => company.employees,
    { cascade: true, nullable: false, onDelete: "CASCADE" }
  )
  company: Company;

  @ManyToMany(
    type => Event,
    event => event.participants,
    { cascade: true }
  )
  @JoinTable()
  events: Event[];

  @ManyToMany(
    type => Activity,
    activity => activity.participants
  )
  @JoinTable()
  activities: Activity[];

  @OneToMany(
    type => PlayerId,
    playerId => playerId.user
  )
  playerIds: PlayerId[];
}

export default User;
