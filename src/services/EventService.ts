import Event from "../entities/event.entity";
import User from "../entities/user.entity";
import EventModel from "../models/EventModel";
import UserModel from "../models/UserModel";
import CompanyModel from "../models/CompanyModel";
import ServerError from "../types/errors/ServerError";
import RequestNotValidError from "../types/errors/RequestNotValidError";
import {ImageType} from "../types/ImageType";
import {getPagingResponseMessage, cleanInput, updateEntityFields, getDataUrl, removeImages} from "../modules/helpers";
import ResourceNotFoundError from "../types/errors/ResourceNotFoundError";
import InputNotValidError from "../types/errors/InputNotValidError";
import ActivityService from "./ActivityService";

export default class EventService {
    private eventModel = new EventModel();
    private userModel = new UserModel();
    private companyModel = new CompanyModel();
    private activityService = new ActivityService();
    private possibleFields = ["title", "description", "startTime", "endTime", "location", "goodToKnow"];
    
    async getEvents() {
        return this.eventModel.getAllEvents(['activities', 'company']).then(events => {
            const eventsWithImages = events.map(event => {
                event.coverImageUrl = getDataUrl(event.coverImageUrl, ImageType.MINIATURE);
                return event;
            })
            return eventsWithImages;
        }).catch(() => {
            throw new ServerError("Could not fetch events");
        })
    }

    async getEvent(eventId: number) {
        return this.eventModel.getEventById(eventId, ["activities", "company"]).then(event => {
            event.coverImageUrl = getDataUrl(event.coverImageUrl, ImageType.COMPRESSED);
            return event;
        }).catch(() => {
            throw new ServerError("Could not fetch event");
        });
    }

    async getEventParticipants(eventId: number, sortingParams: string[]) {
        // get all users on specified event
        const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
        const sortableOrder = ["ASC", "DESC"];
        const [column, order] = sortingParams;

        if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
            throw new RequestNotValidError("Specified column or order to sort by id wrong");
        }
        
        return this.userModel.getUsersOn("events", eventId, [], column, order).then(participants => {
            const participantsWithImages = participants.map(participant => {
                participant.profileImageUrl = getDataUrl(participant.profileImageUrl, ImageType.MINIATURE);
                return participant;
              })
            return participantsWithImages;
        })
        .catch(() => {
            throw new ServerError("Could not fetch event participants");
        });
    }

    async getEventParticipantsV1(eventId: number, sortingParams: string[], limit: number, offset: number, searchParam: string, requestPath: string) {
        const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
        const sortableOrder = ["ASC", "DESC"];
        
        const [column, order] = sortingParams;

        if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
            throw new ServerError("Specified column or order to sort by is wrong");
        }
        // Not optimal to fetch this seperately.
        const totalRecords = await this.userModel.getUsersCount("events", eventId, searchParam).catch(() => {
            throw new ServerError("Could not fetch event participants");
        });

        return this.userModel.getUsersOnV1("events", eventId, [], column, order, searchParam, limit, offset).then(users => {
            const participantsWithImages = users.map(participant => {
                participant.profileImageUrl = getDataUrl(participant.profileImageUrl, ImageType.MINIATURE);
                return participant;
                })
            const responseMessage = getPagingResponseMessage(participantsWithImages, totalRecords, offset, limit, requestPath);
            return responseMessage
        }).catch(() => {
            throw new ServerError("Could not fetch event participants");
        })
    }

    async getEventActivities(eventId: number) {
        return this.eventModel.getEventActivities(eventId).catch(() => {
            throw new ServerError("Could not fetch event activities");
        })
    }

    async createEvent(eventData, companyId, coverImagePath) {
            
        let company = await this.companyModel.getCompanyById(companyId).catch(error => {
            throw new ServerError("Could not create new event");
        });
        
        if(!company){
            removeImages(coverImagePath);
            throw new ResourceNotFoundError("No company was found for the provided company id");
        }
        
        const event = updateEntityFields(new Event(), eventData, this.possibleFields);
        event.company = company;
        event.coverImageUrl = coverImagePath;
        
        return this.eventModel.saveEvent(event).then(event => {
            return event
        }).catch(() => {
            removeImages(coverImagePath);
            throw new ServerError("Could not create new event")
        })
    }

    async addEventParticipant(eventId, userId) {
        const event = await this.eventModel.getEventById(eventId, ["participants", "company"]);
        const user = await this.userModel.getUserById(userId, [], ["company"]);
        if (!event) {
            throw new ResourceNotFoundError("The event does not exist");
        }
        if (!user) {
            throw new ResourceNotFoundError("The user does not exist");
        }
        if (user.company.id !== event.company.id) {
            throw new RequestNotValidError("The user is not an employee of the company");
        }
        event.participants.push(user);
        return this.eventModel.saveEvent(event).then(() => {
            return {message: `User added to event ${event.title}`}
        }).catch(() => {
            throw new ServerError("Could not add user to event");
        })
    }

    async updateEvent(eventId, eventData, coverImagePath) {
        const eventToUpdate = await this.eventModel.getEventById(eventId).catch(error => {
            throw new ServerError("Could not update event", "Error while trying to fetch event");
        });

        if (!eventToUpdate) {
            throw new ResourceNotFoundError("The event does not exist");
        }

        const updatedEvent = updateEntityFields(eventToUpdate, eventData, this.possibleFields);

        let oldFilePath;
        if (coverImagePath) {
            oldFilePath = eventToUpdate.coverImageUrl;
            updatedEvent.coverImageUrl = coverImagePath;
        } else {
            oldFilePath = null;
        }
        return this.eventModel.saveEvent(updatedEvent).then(event => {
            removeImages(oldFilePath);
            return event;
        }).catch(error => {
            removeImages(coverImagePath);
            throw new ServerError("Could not update event", error.name);
        })
    }

    async removeEventParticipant(eventId: number, userId: number) {
        const event = await this.eventModel.getEventById(eventId, ["participants", "activities"]).catch(() => {
            throw new ServerError("Could not remove event participant");
        })

        if(!event){
            throw new ResourceNotFoundError("The event does not exist");
        }

        const user: User = event.participants.find(participant => 
            participant.id.toString() === userId.toString())
        
        if(!user){
            return; // Throw error here instead??
        }
        // Remove user from each event activity
        event.activities.forEach(activity => {
            this.activityService.removeActivityParticipant(activity.id, user.id).catch(() => {
                console.error("Could not remove user from activity "+ activity.title);
            });
        })
        
        const idx = event.participants.indexOf(user);
        if (idx > -1) {
            event.participants.splice(idx, 1);
        }
        return this.eventModel.saveEvent(event).catch(() => {
            throw new ServerError("Could not remove participant from event")
        });
    }

    async deleteEvent(eventId: number) {
        const eventToDelete = await this.eventModel.getEventById(eventId, ["activities"]).catch(() => {
            throw new ServerError("Could not remove event", "Error while fetching event");
        })

        if (!eventToDelete) {
            throw new ResourceNotFoundError("The event does not exist");
        }

        return this.eventModel.deleteEvent(eventId).then(deletedEvent => {
            removeImages(deletedEvent.coverImageUrl);
            eventToDelete.activities.forEach(activity => {
                removeImages(activity.coverImageUrl);
            })
            return;
        }).catch(() => {
            throw new ServerError("Could not remove event");
        })
    }

    async deleteCoverImage(eventId: number) {

        const event = await this.eventModel.getEventById(eventId).catch(() => {
            throw new ServerError("Could not delete cover image", "Error while fetching event");
        });
      
        if (!event) {
          throw new ResourceNotFoundError("The event does not exist");
        }
        
        const imageToRemove = event.coverImageUrl;
        event.coverImageUrl = null;

        return this.eventModel.saveEvent(event).then(() => {
            removeImages(imageToRemove);
            return;
        }).catch(() => {
            throw new ServerError("Could not remove cover image")
        })
    }
}