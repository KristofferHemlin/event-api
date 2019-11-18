import { getRepository, createQueryBuilder } from 'typeorm';
import Event from '../entities/event.entity';

export default class EventModel {

    getEventById(eventId: number, additionalRelations: string[]=[]): Promise<Event> {
        return getRepository(Event)
            .findOne({id: eventId}, {relations: additionalRelations})
            .catch(error => {
                console.error("Error while fetching event:", error);
                return Promise.reject(error); 
            });
    }
}