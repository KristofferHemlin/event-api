import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    Column,
    PrimaryColumn,
    JoinColumn,
  } from 'typeorm';
import User from './user.entity';

@Entity()
class PlayerId {
    @PrimaryColumn()
    id: string

    @ManyToOne(type => User, user => user.playerIds, {nullable: false, onDelete: "CASCADE"})
    user: User 
}

export default PlayerId;