import { getRepository, createQueryBuilder } from 'typeorm';

import Activity from "../entities/activity.entity";
import ActivityUpdateLog from '../entities/activitylog.entity';

export default class ActivityModel {
    
  getActivities(additionalRelations=[]) : Promise<Activity[]> {
    return getRepository(Activity).find({relations: additionalRelations, order: {id: "ASC"}})
      .then(activities => {
        return activities
      })
      .catch(error => {
        console.error("Error while fetching activities:", error);
        return Promise.reject(error);
      })
      }
  
  saveActivity(activity: Activity) : Promise<Activity> {
        return getRepository(Activity).save(activity)
        .then(activity => {
          return activity;
        })
        .catch(error => {
          console.error("Error while trying to create an activity:", error);
          return Promise.reject(error);
        })
    }
  
  getActivityById(activityId: number, additionalRelations=[]) : Promise<Activity> {
    return getRepository(Activity).findOne({id: activityId}, {relations: additionalRelations})
    .then(
      (activity: Activity) => {
        return activity
    })
    .catch(error => {
      console.error("Error while fetching activity:", error);
      return Promise.reject(error);
    })
  }
  
  deleteActivity(activityId: number): Promise<Activity> {
    return getRepository(Activity).findOne({id: activityId}).then(activity => {
      return getRepository(Activity).remove(activity).then(_ => {
        return activity;
      })
    }).catch(error => {
      console.error("Error while deleting activity:", error);
      return Promise.reject(error);
    })
  }

  saveUpdateLog(updateLog: ActivityUpdateLog): Promise<ActivityUpdateLog> {
    return getRepository(ActivityUpdateLog).save(updateLog).catch( error => {
      console.error(`Could not log activity update for activity ${updateLog.activity.id}:` , error)
      return Promise.reject(error);
    });
    
  }

}
