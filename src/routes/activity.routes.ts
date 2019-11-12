import * as express from 'express';
import * as activityController from '../controllers/activity.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpActivityRoutes(app) {

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
    activityController.getAllActivities(req, res).catch(error => {
      console.error("Error in getAllActivities: ", error)
      res.status(500).send({
        type: error.name,
        message: "Could not fetch activities"
      })
    });
  })

  /**
  * @api {get} /activities/:activityId Get the specified activity.
  * @apiName GetActivity
  * @apiGroup Activity
  * 
  * @apiParam {Number} activityId The unique identifier of the parent event.
  */

 app.get('/activities/:activityId', (req: express.Request, res: express.Response) => {
  activityController.getActivity(req, res).catch(error => {
    console.error("Error in getActivity: ", error);
    res.status(500).send({
      type: error.name,
      message: "Could not fetch activity"
    })
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
   activityController.getActivityUsers(req, res).catch(error => {
     console.error("Error in getActivityUsers: ", error);
     res.status(500).send({
       type: error.name,
       message: "Could not fetch activity participants"
     })
   });
 })

 // Add pagination
 /**
 * @api {get} v1/activities/:activityId/users Fetch all users on a specific activity.
 * Query params: sort=column:order, offset=pagination offset (number), limit=limit of number of records returned (number)
 * Example: /v1/activities/:activityId/users?sort=firstName:asc&offset=3&limit=10
 * @apiDescription Fetch all users for an activity. 
 * 
 * Specify sort order by /events/:eventId/users?sort=firstName:asc
 * @apiName GetActivityParticipantsV1
 * @apiGroup Activity
 * 
 * @apiParam {number} activityId The unique identifier of the activity
 */

app.get('/v1/activities/:activityId/users', (req: express.Request, res: express.Response) => {
  activityController.getActivityUsersV1(req, res).catch(error => {
    console.error("Error in getActivityUsers: ", error);
    res.status(500).send({
      type: error.name,
      message: "Could not fetch activity participants"
    })
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

  app.post('/activities', (req: express.Request, res: express.Response) => {
    activityController.createActivity(req, res).catch(error => {
      console.error("Error in createActivity: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not create activity"
      })
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

  app.post('/activities/:activityId/add-user', (req: express.Request, res: express.Response) => {
    activityController.addUserToActivity(req, res).catch(error => {
      console.error("Error in addUserToActivity: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not add user to activity"
      })
    });
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
    activityController.deleteActivity(req, res).catch(error => {
      console.error("Error in deleteActivity: ", error);
      res.status(500).send({
        type: error.name, 
        message: "Could not delete activity"
      })
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

  app.put('/activities/:activityId', (req: express.Request, res: express.Response) => {
    activityController.updateActivity(req, res).catch(error => {
      console.error("Error in updateActivity: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not update activity"
      })
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
    activityController.deleteCoverImage(req, res).catch(error => {
      console.error("Error in deleteCoverImage: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not delete cover image"
      })
    });
  })

}

export default setUpActivityRoutes;
