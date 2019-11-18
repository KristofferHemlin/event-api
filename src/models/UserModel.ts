import { getRepository, createQueryBuilder } from 'typeorm';

import User from '../entities/user.entity';
import PlayerId from '../entities/playerId.entity';

export default class UserModel {

    getUserById(userId: number, additionalRelations: string[]=[]): Promise<User> {
        return getRepository(User)
            .findOne({id: userId}, {relations: additionalRelations})
            .catch(error => {
                console.error("Error while fetching user:", error);
                return Promise.reject(error); 
            });
    }

    // Find a good term for type for activities and events
    getParticipants(type: string, id: number, additionalRelations: string[]=[], sortColumn="id", sortOrder="ASC"): Promise<User[]> {
        try {
            return this.fetchParticipantBuilder(type, id, additionalRelations, "")
                .orderBy(`User.${sortColumn}`, sortOrder.toUpperCase()==="ASC"? "ASC": "DESC")
                .getMany()
                .catch(error => {
                console.error(`Error while fetching users for ${type}:`, error);
                return Promise.reject(error);
                })
        } catch (error) {
            console.error(`Error while fetching users for ${type}:`, error);
            return Promise.reject(error);
        }
      }
    
    getParticipantsV1(type: string, id: number, additionalRelations, sortColumn, sortOrder, searchParam, limit, offset): Promise<User[]> {        
        try {
            return this.fetchParticipantBuilder(type, id, additionalRelations, searchParam)
                .offset(offset)
                .limit(limit)
                .orderBy(`User.${sortColumn}`, sortOrder.toUpperCase()=="ASC"? "ASC": "DESC")
                .getMany()
                .then((participants: User[]) => {
                    return participants;
                }).catch(error => {
                    console.error(`Error while fetching users for ${type}:`, error);
                    return Promise.reject(error);
                })
        } catch (error) {
            console.error(`Error while fetching users for ${type}:`, error);
            return Promise.reject(error);
        }
    }
    
    getParticipantCount(table: string, id: number, searchValue): Promise<number> {
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