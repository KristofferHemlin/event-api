import { getRepository, createQueryBuilder } from 'typeorm';

import User from '../entities/user.entity';
import PlayerId from '../entities/playerId.entity';
import { rejects } from 'assert';

export default class UserModel {

    getUserById(userId: number, additionalFields: string[]=[], additionalRelations: string[]=[]): Promise<User> {
        return this.getUserBy("id", userId.toString(), additionalFields, additionalRelations);
    }

    getUserByEmail(email: string, additionalFields: string[] = [], additionalRelations: string[]=[]): Promise<User> {
        return this.getUserBy("email", email, additionalFields, additionalRelations);
    }

    getUserByToken(token: string, additionalFields: string[]=[], additionalRelations: string[]=[]): Promise<User> {
        return this.getUserBy("resetPwdToken", token, additionalFields, additionalRelations);
    }

    saveUser(user: User): Promise<User> {
        return getRepository(User).save(user).catch(error => {
            console.error("Error while saving user:", error);
            return Promise.reject(error);
        })
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
            console.log(`Error while fetching participants for ${table}`, error);
            return Promise.reject(error);
        }
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
                queryBuilder.innerJoinAndSelect("User."+relation, relation)
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
            queryBuilder.innerJoinAndSelect("User."+relation, relation)
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