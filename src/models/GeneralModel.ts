import { getRepository, createQueryBuilder } from 'typeorm';
import Role from '../entities/role.entity';

export default class GeneralModel {

    getRoleFromName(roleName: string): Promise<Role> {
        return getRepository(Role).findOne({ role: roleName }).then((role: Role) => {
            if (role) {
                return role;
            } 
            throw new Error("No role with the given name "+roleName);
        }).catch(error => {
            console.error("Error while fetching role:", error);
            return Promise.reject(error);
        });
    }
}