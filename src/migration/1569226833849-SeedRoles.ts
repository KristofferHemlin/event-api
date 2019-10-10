import {MigrationInterface, QueryRunner, getRepository} from "typeorm";
import Role from '../entities/role.entity'

// Seed file
import ROLES from '../seeds/roles';

export class SeedRoles1569226833849 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {

        let theRoles = [];
        ROLES.forEach(role => {
            const formattedRole = new Role();
            formattedRole.role = role.role;
            theRoles.push(formattedRole);
        });

        await getRepository(Role).save(theRoles);

    }

    public async down(queryRunner: QueryRunner): Promise<any> {

        let listOfRoles = [];
        const getRolesFromSeed = async () => await Promise.all(ROLES.map(async role => {
            const fetchedRole = await getRepository(Role).findOne({ role: role.role }); 
            listOfRoles.push(fetchedRole);
        }))

        await getRolesFromSeed();
        await getRepository(Role).remove(listOfRoles);

    }

}
