import * as parse from 'csv-parse/lib/sync';
import * as fs from 'fs';

import EventModel from '../models/EventModel';
import Activity from '../entities/activity.entity';
import User from '../entities/user.entity';
import ActivityUpdateLog from '../entities/activitylog.entity';
import { getPagingResponseMessage, updateEntityFields, removeImages, getDataUrl, removeFileFromPath } from '../modules/helpers';
import ServerError from '../types/errors/ServerError';
import ResourceNotFoundError from '../types/errors/ResourceNotFoundError';
import InputNotValidError from '../types/errors/InputNotValidError';
import ActivityModel from '../models/ActivityModel';
import RequestNotValidError from '../types/errors/RequestNotValidError';
import UserModel from '../models/UserModel';
import {ImageType} from "../types/ImageType";
import { validateActivityParticipants } from '../modules/validation';

export default class ActivityService {
    private possibleFields = ["title", "description", "startTime", "endTime", "location", "goodToKnow"];
    private eventModel = new EventModel();
    private activityModel = new ActivityModel();
    private userModel = new UserModel();
  
    async getAllActivities() {
      return this.activityModel.getActivities(['participants', 'company']).then(activities => {
        const activitiesWithImages = activities.map(activity => {
            activity.coverImageUrl = getDataUrl(activity.coverImageUrl, ImageType.MINIATURE);
            return activity
        })
        return activitiesWithImages;
      }).catch(() => {
          throw new ServerError("Could not fetch activities.")
        })
    }
  
    async getActivity(activityId: number) {
      return this.activityModel.getActivityById(activityId).then(activity => {
          activity.coverImageUrl = getDataUrl(activity.coverImageUrl, ImageType.COMPRESSED);
          return activity;
      })
        .catch(() => {
          throw new ServerError("Could not fetch activity");
        })
    }
  
    async getActivityParticipants(activityId: number, sortingParams: string[]) {
        const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
        const sortableOrder = ["ASC", "DESC"];
        
        const [column, order] = sortingParams;
    
        if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
            throw new RequestNotValidError("Specified column or order to sort by is wrong.");
        }

        return this.userModel.getUsersOn("activities", activityId, [], column, order).then(participants => {
            // If this is too slow, set profileImageUrl to null before returning.
            const participantsWithImages = participants.map(participant => {
              participant.profileImageUrl = getDataUrl(participant.profileImageUrl, ImageType.MINIATURE);
              return participant;
            })
            return participantsWithImages;
        })
        .catch(() => {
            throw new ServerError("Could not fetch activity participants");
        });
    }
  
    async getActivityParticipantsV1(activityId: number, sortingParams:string[], pageLimit: number, pageOffset: number, searchParam: string, requestPath: string) {
      const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
      const sortableOrder = ["ASC", "DESC"];
      const [column, order] = sortingParams;
  
      if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
        throw new RequestNotValidError("Specified column or order to sort by is wrong.")
      }
  
      // Not optimal to have a separate request for this.
      return this.userModel.getUsersCount("activities", activityId, searchParam).then(totalRecords => {
          return this.userModel.getUsersOnV1("activities", activityId, [], column, order, searchParam, pageLimit, pageOffset).then((users: User[]) => {
              const participantsWithImages = users.map(participant => {
                  participant.profileImageUrl = getDataUrl(participant.profileImageUrl, ImageType.MINIATURE);
                  return participant;
                  })
              const responseMessage = getPagingResponseMessage(participantsWithImages, totalRecords, pageOffset, pageLimit, requestPath);
            return responseMessage
            })
      }).catch(() => {
        throw new ServerError("Could not fetch activity participants");
        });
    }
  
    async createActivity(newActivity, eventId, coverImagePath): Promise<Activity> {
      const event = await this.eventModel.getEventById(eventId, ['company'])
        .catch(() => {
          removeImages(coverImagePath);
          throw new ServerError("Could not create activity.", "Error while trying to fetch the specified event");
        });
  
      if(!event){
        removeImages(coverImagePath);
        throw new ResourceNotFoundError('No event could be found for the provided id. No activity created.')
      }
  
      const activity = updateEntityFields(new Activity(), newActivity, this.possibleFields);
      activity.event = event;
      activity.company = event.company;
      activity.coverImageUrl = coverImagePath;
  
      return this.activityModel.saveActivity(activity)
        .catch(() => {
          removeImages(coverImagePath);
          throw new ServerError("Could not create activity.", "Error while trying to save new activity");
        })
    }

    async addParticipants(activityId: number, filePath: string) {

      const activity = await this.activityModel.getActivityById(activityId, ["participants", "event"]).catch(() => {
        throw new ServerError("Could not add activity participants", "Error while fetching activity");
      })

      if (!activity) {
        throw new RequestNotValidError("The activity does not exist");
      }
    
      const file = fs.readFileSync(filePath);
      removeFileFromPath(filePath);
      
      let recordObjects;
      try {
          recordObjects = parse(file, {columns: true, skip_empty_lines: true});
      } catch (error) {
          throw new RequestNotValidError("Error in file", {type: error.code, column: error.column, record: error.record})
      }

      const userInfo = recordObjects.map(record => {
        return record.email;
      })
      const users = await this.userModel.getUsersByEmail(userInfo, [], ["events"]).catch(() => {
        throw new ServerError("Could not add activity participants", "Error while fetching users");
      });

      const [usersValid, errorMessage, errorDetails] = validateActivityParticipants(activity, users, userInfo);
      if (!usersValid) {
        throw new InputNotValidError(errorMessage, errorDetails);
      }

      activity.participants = activity.participants.concat(users);
      return this.activityModel.saveActivity(activity).then(() => {
        return {message: "Participants added"}
      }).catch(() => {
        throw new ServerError("Could not add activity participants", "Error while saving activity");
      })
    }
  
    async addParticipant(activityId: number, userId: number){
      const activity = await this.activityModel.getActivityById(activityId, ["participants", "event"])
        .catch(() => {
          throw new ServerError("Could not add user to activity", "Error while fetching activity.");
        });
      
      if (!activity) {
        throw new ResourceNotFoundError("Activity not found.");
      }
  
      const user = await this.userModel.getUserById(userId, [], ["events"]).catch(error => {
        throw new ServerError("Could not add user to activity", "Error while fetching user");
      })
  
      if (!user) {
        throw new ResourceNotFoundError("User not found.");
      }
  
      // Check that user is a participant on the event.
      if (user.events.find(event => { return event.id === activity.event.id})) {
        activity.participants.push(user);
        return this.activityModel.saveActivity(activity).then(_ => {
          return {message: `Successfully added ${user.firstName} ${user.lastName} to activity ${activity.title}.`}
        }).catch(error => {
          throw new ServerError("Could not add user to activity.", "Error while updating activity");
        });
      } else {
        throw new RequestNotValidError("The user is not a participant of the activity parent event");
      }
    }
  
    async updateActivity(activityId, updatedActivity, coverImagePath) {
      const activityToUpdate = await this.activityModel.getActivityById(activityId).catch(error => {
        throw new ServerError("Could not update activity", "Error while fetching activity");
      })
  
      if (!activityToUpdate) {
        throw new ResourceNotFoundError("No activity founs with provided id")
      }
  
      const newActivity = updateEntityFields(activityToUpdate, updatedActivity, this.possibleFields);
  
      let oldFileUrl;
      if (coverImagePath) {
        oldFileUrl = activityToUpdate.coverImageUrl;
        newActivity.coverImageUrl = coverImagePath;
      } else {
        oldFileUrl = null;
      }
  
      let activityLog = new ActivityUpdateLog();
      activityLog.activity = newActivity;
  
      const savedActivity = await this.activityModel.saveActivity(newActivity).catch(() => {
        removeImages(coverImagePath);
        throw new ServerError("Could not update activity", "Error while trying to save activity")
      })
  
      if (savedActivity) {
        removeImages(oldFileUrl);
        this.userModel.getUsersOn("activities", activityId, ["playerIds"]).then(users => {
          if (users.length > 0) {
            const recipients = [].concat(...users.map(user => {
              return user.playerIds.map(playerId => {
                return playerId.id;
              })
            }));
            var pushMessage = { 
              app_id: process.env.ONESIGNAL_ID,
              headings: {"en": "Activity Updated", "sv": "Aktivitet uppdaterad"},
              contents: {"en": savedActivity.title, "sv": savedActivity.title},
              android_group: "activity_update",
              include_player_ids: recipients
            };
            this.sendPush(pushMessage, (invalidIds) => {
              this.userModel.deletePlayerIds(invalidIds).catch(() => {});
            });
          }
          this.activityModel.saveUpdateLog(activityLog).catch(() => {});
        }).catch(() => {});
      }
  
      return savedActivity;
    }
  
    async deleteActivity(activityId: number) {
      return this.activityModel.deleteActivity(activityId).then(deletedActivity => {
        if (deletedActivity) {
          removeImages(deletedActivity.coverImageUrl);
        }
      }).catch(error => {
          throw new ServerError("Could not delete activity");
        })
    }
  
    async deleteCoverImage(activityId) {
      const activity = await this.activityModel.getActivityById(activityId).catch(_ => {
        throw new ServerError("Could not remove cover image", "Error while fetching activity");
      })
  
      if (!activity) {
        throw new ResourceNotFoundError("No activity with provided id found");
      }
  
      if (activity.coverImageUrl){
        const coverImagePath = activity.coverImageUrl;
        activity.coverImageUrl = null;
        this.activityModel.saveActivity(activity).then(activity => {
          removeImages(coverImagePath);
        }).catch(_ => {
          throw new ServerError("Could not remove cover image", "Error while updating activity");
        })
        }
      return;
    }

    async removeActivityParticipant(activityId: number, userId: number) {
      const activity = await this.activityModel.getActivityById(activityId, ["participants"]);
      if(!activity){
        throw new ResourceNotFoundError("The activity does not exist");
      }

      const user: User = activity.participants.find(participant => 
          participant.id.toString() === userId.toString())
      if(!user){
          return; // Throw error here instead??
      }
      
      const idx = activity.participants.indexOf(user);
      if (idx > -1) {
          activity.participants.splice(idx, 1);
      }
      return this.activityModel.saveActivity(activity).catch(() => {
          throw new ServerError("Could not remove participant from activity");
      });
    }
  
    // Should reuse this when push should be sent when events updates as well. 
    private sendPush(data, onInvalidIds) {
      var https = require('https');
    
      var headers = {
        "Content-Type": "application/json; charset=utf-8"
      };
      
      var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
      };
    
      var request = https.request(options, function(response) {  
        response.on('data', function(dataResponse) {
          const parsedData = JSON.parse(dataResponse.toString());
          //checkRecipients(data.include_player_ids, parsedData.recipients);
          if (parsedData.errors) {
            // invalid_player_ids = playerIds (devices) that has unsubscribed from notifications.
            const {invalid_player_ids, ...otherErrors} = parsedData.errors
            if (invalid_player_ids) {
              onInvalidIds(invalid_player_ids);
            }
            if (Object.keys(otherErrors).length > 0) {
              console.error("Error when sending push:");
              console.error(parsedData);
            }
          }
        })
      });
    
      request.on('error', function(e) {
        console.error("Error during OneSignal request:");
        console.error(e);
      });
    
      request.write(JSON.stringify(data));
      request.end();
    }
  
  }