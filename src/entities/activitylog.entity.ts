import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
import Activity from './activity.entity';

@Entity()
class ActivityUpdateLog {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn({type: "timestamp"})
    createdAt: Date

    @ManyToOne(type => Activity, activity => activity.updateLogs, {cascade: true})
    activity: Activity
}

export default ActivityUpdateLog;