import * as express from 'express';
import * as activityController from '../controllers/activity.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpActivityRoutes(app) {

  // Middleware
  // app.use('/activities', (req, res, next) => {
  //   isAuthenticated(req, res, next);
  // })

  /**
  * @api {get} /activities Get all activities.
  * @apiName GetActivites
  * @apiGroup Activity
  */

  app.get('/activities', (req: express.Request, res: express.Response) => {
    activityController.getAllActivities(req, res);
  })

  /**
  * @api {get} /activities/:activityId Get the specified activity.
  * @apiName GetActivity
  * @apiGroup Activity
  * 
  * @apiParam {Number} activityId The unique identifier of the parent event.
  */

 app.get('/activities/:activityId', (req: express.Request, res: express.Response) => {
  activityController.getActivity(req, res);
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
  */

  app.post('/activities', (req: express.Request, res: express.Response) => {
    activityController.createActivity(req, res);
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

  app.post('/activities/:activityId/add-user', (req: express.Request, res: express.Response) => {
    activityController.addUserToActivity(req, res);
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
    activityController.deleteActivity(req, res);
  })



  /**
  * @api {put} /activities/:activityId Update the activity information.
  * @apiName UpdateActivityInformation
  * @apiDescription This route is not available yet.
  * @apiPermission Admin & Company Manager (or user set to organizer of the parent event.)
  * @apiGroup Activity
  *
  * @apiParam {Number} activityId The unique identifier of the activity.
  */


}

export default setUpActivityRoutes;
