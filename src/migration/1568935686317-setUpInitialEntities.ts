import {MigrationInterface, QueryRunner, getRepository, Repository} from "typeorm";
import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import Event from '../entities/event.entity';
import Activity from '../entities/activity.entity';

// Seed files.
const JSON = require('../seeds/convertedCSV.json');
import companySeed from '../seeds/company.seed';


export class setUpInitialEntities1568935686317 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        
        // 1. Create the company and add it to the DB.
        const theCompany = new Company();
        theCompany.title = companySeed.title;
        await getRepository(Company).save(theCompany);

        // 2. Get the newly created company from the DB.
        const createdCompany = await getRepository(Company).findOne({ title: theCompany.title });

        // Create the activities.
        const theActivity = new Activity();
        theActivity.title = 'Hiking i Bergen av Split',
        theActivity.description = 'Maecenas sodales, diam ac scelerisque sollicitudin, urna augue tempor nisi, at feugiat dolor turpis sed ex. Nam pharetra sem dolor.'
        theActivity.company = createdCompany;
        await getRepository(Activity).save(theActivity);

        // Get the newly created activity from the DB.
        const createdActivity = await getRepository(Activity).findOne({ title: 'Hiking i Bergen av Split' });

        // 3. Create the event and add it to the DB (+ add the company to the event).
        const theEvent = new Event();
        theEvent.title = 'Claremont i Kroatien';
        theEvent.description = 'Sed magna enim, fringilla eget quam vitae, condimentum euismod turpis. Phasellus dignissim purus sit amet felis finibus, eget tristique urna feugiat.' 
        theEvent.company = createdCompany;
        theEvent.activities = [];
        theEvent.activities.push(createdActivity);
        await getRepository(Event).save(theEvent);

        // 4. Get the newly created Event from the DB.
        const createdEvent = await getRepository(Event).findOne({title: theEvent.title});

        // 5. Sets up the users (+ add the event and company to the user).
        let formattedUsers = [];
        await JSON.forEach(user => {
            let formattedUser = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                isActive: false,
                company: createdCompany,
                events: [],
                activities: [],
            }
            formattedUser.activities.push(createdActivity);
            formattedUser.events.push(createdEvent);
            formattedUsers.push(formattedUser);
        })
        await getRepository(User).save(formattedUsers);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        
        // Gets all the inital users
        let listOfUsers = [];
        const getAllInitialUsers = async () => await Promise.all(JSON.map(async user => {
            const fetchedUser = await getRepository(User).findOne({email: user.email})
            listOfUsers.push(fetchedUser);
        }))

        await getAllInitialUsers();


        // Removes all the initial users from the database. 
        await getRepository(User).remove(listOfUsers);
        console.log('Removed all default Claremont users.');

        // Removes all the acativities.
        const fetchedActivity = await getRepository(Activity).findOne({ title: 'Hiking i Bergen av Split'});
        await getRepository(Activity).remove(fetchedActivity);

        // Remove the Event.
        const fetchedEvent = await getRepository(Event).findOne({ title: 'Claremont i Kroatien' });
        await getRepository(Event).remove(fetchedEvent);

        // Remove the company from the DB.
        const fetchedCompany = await getRepository(Company).findOne({ title: companySeed.title });
        await getRepository(Company).remove(fetchedCompany);

    }

}
