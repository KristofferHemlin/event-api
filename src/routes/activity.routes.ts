import * as express from 'express';
import isAuthenticated from '../middleware/isAuthenticated';
import {uplodActivityCoverImage} from '../middleware/fileUploads'
import ActivityService from "../services/ActivityService";
import ApplicationError from "../types/errors/ApplicationError";
import Activity from '../entities/activity.entity';
import User from '../entities/user.entity';
import { getSortingParams } from '../modules/helpers';

function setUpActivityRoutes(app) {
  const activityService = new ActivityService();
  // Middleware
  app.use('/activities', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

  app.use('/v1/activities', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

  /**
  * @api {get} /activities Get all activities.
  * @apiName GetActivites
  * @apiGroup Activity
  */

  app.get('/activities', (req: express.Request, res: express.Response) => {
    activityService.getAllActivities().then((activities: Activity[]) => {
      res.json(activities);
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

  /**
  * @api {get} /activities/:activityId Get the specified activity.
  * @apiName GetActivity
  * @apiGroup Activity
  * 
  * @apiParam {Number} activityId The unique identifier of the parent event.
  */

  app.get('/activities/:activityId', (req: express.Request, res: express.Response) => {
    const activityId = req.params.activityId;
    activityService.getActivity(activityId).then((activity: Activity) => {
      res.json(activity)
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
})

  /**
   * @api {get} /activities/:activityId/users Fetch all users on a specific activity.
   * @apiDescription Fetch all users for an activity. Specify sort order by /events/:eventId/users?sort=firstName:asc
   * @apiName GetActivityParticipants
   * @apiGroup Activity
   * 
   * @apiParam {number} activityId The unique identifier of the activity
   */

  app.get('/activities/:activityId/users', (req: express.Request, res: express.Response) => {
    const activityId = req.params.activityId;
    const sortingParams = getSortingParams(req);

    activityService.getActivityParticipants(activityId, sortingParams).then((participants: User[]) => {
      res.json(participants)
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });

 })

  // Add pagination and search
  /**
   * @api {get} v1/activities/:activityId/users Fetch all users on a specific activity.
   * Query params: sort=column:order, offset=records to skip (number), limit=limit of number of records returned (number, default 100)
   *  search=text to match firstName, lastName or company department with
   * Example: /v1/activities/:activityId/users?sort=firstName:asc&offset=3&limit=10&search="test"
   * @apiDescription Fetch all users for an activity. 
   * 
   * Specify sort order by /events/:eventId/users?sort=firstName:asc
   * @apiName GetActivityParticipantsV1
   * @apiGroup Activity
   * 
   * @apiParam {number} activityId The unique identifier of the activity
   */

  app.get('/v1/activities/:activityId/users', (req: express.Request, res: express.Response) => {
    const activityId = req.params.activityId;
    const sortingParams = getSortingParams(req);
    const limit = req.query.limit? parseInt(req.query.limit): 100;
    const offset = req.query.offset? parseInt(req.query.offset): 0;
    const search = req.query.search;
    const requestPath = req.url;

    activityService.getActivityParticipantsV1(activityId, sortingParams, limit, offset, search, requestPath).then(message => {
      res.json(message)
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })

  /**
  * @api {post} /activities Create a new activity.
  * @apiName PostActivities
  * @apiPermission Admin & Company Manager (or user set to organizer of the parent event.)
  * @apiGroup Activity
  *
  * @apiParam {Number} eventId The unique identifier of the parent event.
  * @apiParam {String} title The title of the activity.
  * @apiParam {String} description The description of the activity.
  * @apiParam {String} startTime (YYYY-MM-DD HH:MM) Date and time when the activity starts.
  * @apiParam {String} endTime (YYYY-MM-DD HH:MM) Date and time when the activity ends.
  * @apiParam {String} location Activity location.
  * @apiParam {String} goodToKnow Things that is good to know about the activity
  */

  app.post('/activities', uplodActivityCoverImage, 
  async (req, res) => {
    const {eventId, imageUrl, ...newActivity} = req.body;
    
    activityService.createActivity(newActivity, eventId, imageUrl).then( activity => {
      res.json(activity);
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })

  /**
  * @api {post} /activities/:activityId/add-user Add a user to the activity.
  * @apiName AddUserToActivity
  * @apiPermission Admin & Company Manager (or user set to organizer of the parent event.)
  * @apiGroup Activity
  *
  * @apiParam {Number} activityId The unique identifier of the activity.
  * @apiParam {Number} userId The unique identifier of the user.
  */

  app.post('/activities/:activityId/users/:userId', (req: express.Request, res: express.Response) => {
    const activityId = req.params.activityId;
    const userId = req.params.userId;
    activityService.addParticipant(activityId, userId).then(message => {
      res.json(message);
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })

  /**
  * @api {put} /activities/:activityId Update the activity information.
  * @apiName UpdateActivityInfo
  * @apiDescription Update the activity information
  * @apiPermission Admin & Company Manager (or user set to organizer of the parent event.)
  * @apiGroup Activity
  *
  * @apiParam {Number} activityId The unique identifier of the activity.
  * @apiParam {String} title The title of the activity.
  * @apiParam {String} description The description of the activity.
  * @apiParam {String} startTime (YYYY-MM-DD HH:MM) Date and time when the activity starts.
  * @apiParam {String} endTime (YYYY-MM-DD HH:MM) Date and time when the activity ends.
  * @apiParam {String} location Activity location.
  * @apiParam {String} goodToKnow Things that is good to know about the activity
  */

  app.put('/activities/:activityId', uplodActivityCoverImage,
  (req, res) => {
    const activityId = req.params.activityId;
    const {imageUrl, ...newActivity} = req.body;
    activityService.updateActivity(activityId, newActivity, imageUrl).then(activity => {
      res.json(activity);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

  /**
  * @api {delete} /activities/:activityId Remove a user from the activity.
  * @apiName RemoveUserFromActivity
  * @apiPermission ADMIN (or user set to organizer of the parent event.)
  * @apiGroup Activity
  *
  * @apiParam {Number} activityId The unique identifier of the activity.
  */

  app.delete('/activities/:activityId', (req: express.Request, res: express.Response) => {
    const activityId = req.params.activityId;
    activityService.deleteActivity(activityId).then(_ => {
      res.status(204).send();
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

  /**
   * @api {delete} /activities/:activityId/coverimage Delete cover image for the activity
   * @apiName DeleteActivityImage
   * @apiDescription Delete the activity cover image
   * @apiGroup Activity
   * 
   * @apiParam {Number} activityId The unique identifier of the activity.
   */

  app.delete('/activities/:activityId/coverimage', (req, res) => {
    const activityId = req.params.activityId;
    activityService.deleteCoverImage(activityId).then(_ => {
      res.status(204).send();
    }).catch((error: ApplicationError) => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

}

export default setUpActivityRoutes;
