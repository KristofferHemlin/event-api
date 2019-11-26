import { getRepository, createQueryBuilder } from 'typeorm';

import User from '../entities/user.entity';
import PlayerId from '../entities/playerId.entity';
import Activity from "../entities/activity.entity";
import Event from "../entities/event.entity";
import ActivityUpdateLog from '../entities/activitylog.entity';

export default class UserModel {

    getAllUsers(additionalRelations: string[]=[]): Promise<User[]> {
        return getRepository(User).find({ relations: additionalRelations, order: { id: 'ASC' } })
            .catch(error => {
                console.error("Error while fetching all users:", error)
                return Promise.reject(error);
            })
    }

    getUserById(userId: number, additionalFields: string[]=[], additionalRelations: string[]=[]): Promise<User> {
        return this.getUserBy("id", userId.toString(), additionalFields, additionalRelations);
    }

    getUserByEmail(email: string, additionalFields: string[] = [], additionalRelations: string[]=[]): Promise<User> {
        return this.getUserBy("email", email, additionalFields, additionalRelations);
    }

    getUserByToken(token: string, additionalFields: string[]=[], additionalRelations: string[]=[]): Promise<User> {
        return this.getUserBy("resetPwdToken", token, additionalFields, additionalRelations);
    }

    
    // Find a good term for type for activities and events
    getUsersOn(relationType: string, relationId: number, additionalRelations: string[]=[], sortColumn="id", sortOrder="ASC"): Promise<User[]> {
        try {
            return this.fetchParticipantBuilder(relationType, relationId, additionalRelations, "")
            .orderBy(`User.${sortColumn}`, sortOrder.toUpperCase()==="ASC"? "ASC": "DESC")
                .getMany()
                .catch(error => {
                    console.error(`Error while fetching users for ${relationType}:`, error);
                return Promise.reject(error);
            })
        } catch (error) {
            console.error(`Error while fetching users for ${relationType}:`, error);
            return Promise.reject(error);
        }
      }
    
      getUsersOnV1(relationType: string, relationId: number, additionalRelations, sortColumn, sortOrder, searchParam, limit, offset): Promise<User[]> {        
        try {
            return this.fetchParticipantBuilder(relationType, relationId, additionalRelations, searchParam)
            .offset(offset)
            .limit(limit)
            .orderBy(`User.${sortColumn}`, sortOrder.toUpperCase()=="ASC"? "ASC": "DESC")
            .getMany()
            .then((participants: User[]) => {
                return participants;
            }).catch(error => {
                console.error(`Error while fetching users for ${relationType}:`, error);
                return Promise.reject(error);
            })
        } catch (error) {
            console.error(`Error while fetching users for ${relationType}:`, error);
            return Promise.reject(error);
        }
    }
    
    getUsersCount(table: string, id: number, searchValue): Promise<number> {
        try {
            return this.fetchParticipantBuilder(table, id, [], searchValue).getCount()
            .catch(error => {
                console.error("Error while counting participants:", error);
                return Promise.reject(error);
            })
        } catch (error) {
            console.error(`Error while fetching participants for ${table}`, error);
            return Promise.reject(error);
        }
    }

    getUserEvents(userId): Promise<Event[]> {
        return createQueryBuilder(Event)
            .innerJoin("Event.participants", "participants")
            .where("participants.id=:userId", { userId: userId })
            .orderBy("Event.id", "ASC")
            .getMany()
            .then(events => {
                return events;
            }).catch(error => {
                console.error("Error while fetching user events")
                return Promise.reject(error);
            })
    }

    getUserEventActivities(userId: number, eventId: number): Promise<Activity[]> {
        return createQueryBuilder(Activity)
            .innerJoin("Activity.participants", "participants", "participants.id=:userId", { userId: userId })
            .where("Activity.event=:eventId", { eventId: eventId })
            .orderBy("Activity.id", "ASC")
            .getMany()
            .then(activities => {
                return activities;
            }).catch(error => {
                console.error("Error while fetching event activities for user:", error);
                return Promise.reject(error);
            })
    }

    getActivityUpdateLogs(userId: number, limit: number): Promise<ActivityUpdateLog[]> {
        return createQueryBuilder(ActivityUpdateLog)
            .innerJoin("ActivityUpdateLog.activity", "activity")
            .innerJoin("activity.participants", "user")
            .where("user.id=:userId", { userId:userId })
            .select("MAX(ActivityUpdateLog.createdAt)", "updatetime")
            .addSelect("activity")
            .groupBy("activity.id")
            .limit(limit)
            .orderBy("updatetime", "DESC")
            .getRawMany()
            .then(rawOutput => {
                const updateData = rawOutput.map(updateLog => {
                    let activityLog = new ActivityUpdateLog();
                    const {updatetime, ...activityRaw} = updateLog;
                    let activity = Object.keys(activityRaw).reduce((activity, key) => {
                        const newKey = key.replace("activity_", "");
                        activity[newKey] = activityRaw[key];
                        return activity;
                      }, new Activity());
                    activityLog.createdAt = updatetime;
                    activityLog.activity = activity;
                    return activityLog; // Could make a v1 and return this better
                });
                return updateData;
            }).catch(error => {
                console.error("Error while fetching activity notifications:", error);
                return Promise.reject(error);
            })
    }

    saveUser(user: User): Promise<User> {
        // Upsert (updates if id already exists else insert new)
        return getRepository(User).save(user).catch(error => {
            console.error("Error while saving user:", error);
            return Promise.reject(error);
        })
    }

    saveUsers(users: User[]): Promise<number> {
        // Creates user only if email does not already exist.
        return createQueryBuilder(User)
            .insert().values(users)
            //.onConflict(`("email") DO NOTHING`) // TODO: Add when db has unique constraint
            .execute()
            .then(insertResult => {
                const numInsterted = insertResult.identifiers.reduce((numRecords, record) => {
                    if (record) {
                        numRecords ++;
                    }
                    return numRecords;
                }, 0)
                return numInsterted;
            }).catch(error => {
                console.error("Error while saving multiple users:", error);
                return Promise.reject(error);
            })
    }

    addPlayerId(playerId: string, user: User) {
        const playerIdRecord = new PlayerId();
        playerIdRecord.id = playerId;
        playerIdRecord.user = user;

        return getRepository(PlayerId).save(playerIdRecord).catch(error => {
            console.error("Error while saving playerId:", error);
            return Promise.reject(error);
        })
    }

    deleteUser(userId: number): Promise<User> {
        return getRepository(User).findOne({id: userId}).then(user => {
            if (user) {
                return getRepository(User).remove(user).then(_ => {
                  return user;
                })
            }
            return; 
          }).catch(error => {
            console.error("Error while deleting user:", error);
            return Promise.reject(error);
          })
    }
    
    deletePlayerIds(playerIds: string[]): Promise<void>{
        return createQueryBuilder(PlayerId)
            .delete()
            .where("player_id.id IN :playerIds", {playerIds: playerIds})
            .execute()
            .then(result => {return})
            .catch(error => {
                console.error(`Error while removing playerIds: `, error)
                return Promise.reject(error);
            })
    }

    private getUserBy(type: string, typeIdentifier: string, additionalFields: string[] = [], additionalRelations: string[]=[]): Promise<User> {
        try {
            let queryBuilder = getRepository(User).createQueryBuilder();
            additionalFields.forEach(field => {
                queryBuilder.addSelect("User."+field)});
            additionalRelations.forEach(relation => {
                queryBuilder.leftJoinAndSelect("User."+relation, relation)
            });
            return queryBuilder.where(`User.${type} = :identifier`, { identifier: typeIdentifier })
                .getOne()
                .catch(error => {
                    console.error(`Error while fetching user by ${type}:`, error);
                    return Promise.reject(error)
                });
        } catch (error) {
            console.error("Error when fetching user:", error);
            return Promise.reject(error);
        }
    }

    private fetchParticipantBuilder(table: string, id: number, additionalRelations: string[], searchValue: string) {
        let queryBuilder = createQueryBuilder(User)
        queryBuilder.innerJoin("User."+table, table, table+".id=:id", {id: id})
        additionalRelations.forEach(relation => {
            queryBuilder.leftJoinAndSelect("User."+relation, relation)
        }) 

        if (searchValue) {
          searchValue = searchValue.toLowerCase();
          queryBuilder
            .where(`LOWER(User.firstName) LIKE :searchParam 
                    OR LOWER(User.lastName) LIKE :searchParam 
                    OR LOWER(User.companyDepartment) LIKE :searchParam`, {searchParam: `%${searchValue}%`})
        }
        return queryBuilder;
      }
    
} 