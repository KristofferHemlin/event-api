import {Entity, Column, PrimaryColumn, OneToOne, JoinColumn} from 'typeorm';
import User from './user.entity';

@Entity()
class Account {

  @PrimaryColumn()
  email: string;

  @Column()
  password: string;

  @OneToOne(type => User, {cascade: true})
  @JoinColumn()
  user: User;
}

export default Account;
