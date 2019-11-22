import { getRepository, createQueryBuilder } from 'typeorm';
import Event from '../entities/event.entity';
import Activity from '../entities/activity.entity';

export default class EventModel {

    getAllEvents(additionalRelations: string[] = []): Promise<Event[]> {
        return getRepository(Event).find({relations: additionalRelations, order: {id: "ASC"}})
            .then(events => {
            return events;
            })
            .catch(error => {
            console.error("Error while fetching events:", error)
            return Promise.reject(error);
            })
    }
    
    getEventById(eventId: number, additionalRelations: string[]=[]): Promise<Event> {
        return getRepository(Event)
            .findOne({id: eventId}, {relations: additionalRelations})
            .catch(error => {
                console.error("Error while fetching event:", error);
                return Promise.reject(error); 
            });
    }

    getEventActivities(eventId: number) {
        return createQueryBuilder(Activity)
            .where("Activity.event =:eventId", {eventId: eventId})
            .orderBy("Activity.id", "ASC")
            .getMany()
            .catch(error => {
                console.error("Error while trying to fetch event activities: "+error);
                return Promise.reject(error);
            })
    }

    saveEvent(event: Event): Promise<Event> {
        return getRepository(Event).save(event).catch(error => {
            console.error("Error while trying to save event:", error);
            return Promise.reject(error);
        })
    }

    deleteEvent(eventId: number): Promise<Event> {
        return getRepository(Event).findOne({id: eventId}).then(event => {
            if (event) {
                return getRepository(Event).remove(event).then(_ => {
                  return event;
                })
            }
            return;
          }).catch(error => {
            console.error("Error while deleting event:", error);
            return Promise.reject(error);
          })
    }
}