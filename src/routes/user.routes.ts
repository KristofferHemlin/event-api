import * as express from 'express';
import isAuthenticated from '../middleware/isAuthenticated';
import UserService from '../services/UserService';
import { uploadUserProfileImage } from '../middleware/fileUploads';

function setUpUserRoutes(app){
  const userService = new UserService();
  // Middleware
  app.use('/users', (req, res, next) => {
     isAuthenticated(req, res, next);
  })

  /**
  * @api {get} /user Get all user-profiles
  * @apiName GetUser
  * @apiGroup User
  */

  // Retrieve all users.
  app.get('/users', (req: express.Request, res: express.Response) => {
    userService.getAllUsers().then(users => {
      res.json(users);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

  /**
  * @api {get} /user/me Gets user-profile for currently authenticated user
  * @apiName GetCurrentUser
  * @apiGroup User
  * @apiSuccess {Number} id  Unique identifier for the user-profile.
  * @apiSuccess {Date} createdAt  Date for when the user-profile was created.
  * @apiSuccess {Date} updatedAt  Date for when the user-profile was last updated.
  * @apiSuccess {string} firstName  First name First name of the user.
  * @apiSuccess {string} lastName  Last name First name of the user.
  * @apiSuccess {string} phone  The users phone number.
  * @apiSuccess {string} email  The users email address.
  * @apiSuccess {Boolean} isActive  Checks if the user-profile has been activated.
  * @apiSuccess {Object} company  Company information.
  * @apiSuccess {Boolean} company.id  Unique identifier for the company.
  * @apiSuccess {Date} company.createdAt  Date for when the company info was created.
  * @apiSuccess {Date} company.updatedAt  Date for when the company info was last updated.
  * @apiSuccess {Date} company.title  The company title.
  * @apiSuccess {Array} events  List of events the user is participating in.
  * @apiSuccess {Object} events.event  Information about an event the user is participating in..
  * @apiSuccess {Number} events.event.id  Unique identifier for the event.
  * @apiSuccess {Number} events.event.title  The title of the event.
  * @apiSuccess {Number} events.event.description  The description of the event.
  * @apiSuccess {Array} activities  List of activites the user is participating in.
  * @apiSuccess {Object} activities.activity  Information about an activity the user is participating in.
  * @apiSuccess {Number} activities.activity.id  Unique identifier for the activity
  * @apiSuccess {Date} activities.activity.createdAt  Date for when the ativity info was created.
  * @apiSuccess {Date} activities.activity.updatedAt  Date for when the activity info was last updated.
  * @apiSuccess {String} activities.activity.title  The title of the activity.
  * @apiSuccess {String} activities.activity.description  The description of the activity.
  */

  // Retrieve information for a single logged in user.
  app.get('/users/me', (req, res: express.Response) => {
    const userId = req.decoded.userId;
    userService.getUserById(userId).then(user => {
      res.json(user)
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  });

  /**
  * @api {get} /users/:userid Get a single user-profile by id.
  * @apiName GetSingleUSer
  * @apiGroup User
  *
  * @apiParam {Number} userId The unique id of the user.
  *
  * @apiSuccess {Number} id  Unique identifier for the user-profile.
  * @apiSuccess {Date} createdAt  Date for when the user-profile was created.
  * @apiSuccess {Date} updatedAt  Date for when the user-profile was last updated.
  * @apiSuccess {string} firstName  First name First name of the user.
  * @apiSuccess {string} lastName  Last name First name of the user.
  * @apiSuccess {string} phone  The users phone number.
  * @apiSuccess {string} email  The users email address.
  * @apiSuccess {Boolean} isActive  Checks if the user-profile has been activated.
  * @apiSuccess {Object} company  Company information.
  * @apiSuccess {Boolean} company.id  Unique identifier for the company.
  * @apiSuccess {Date} company.createdAt  Date for when the company info was created.
  * @apiSuccess {Date} company.updatedAt  Date for when the company info was last updated.
  * @apiSuccess {Date} company.title  The company title.
  * @apiSuccess {Array} events  List of events the user is participating in.
  * @apiSuccess {Object} events.event  Information about an event the user is participating in..
  * @apiSuccess {Number} events.event.id  Unique identifier for the event.
  * @apiSuccess {Number} events.event.title  The title of the event.
  * @apiSuccess {Number} events.event.description  The description of the event.
  * @apiSuccess {Array} activities  List of activites the user is participating in.
  * @apiSuccess {Object} activities.activity  Information about an activity the user is participating in.
  * @apiSuccess {Number} activities.activity.id  Unique identifier for the activity
  * @apiSuccess {Date} activities.activity.createdAt  Date for when the ativity info was created.
  * @apiSuccess {Date} activities.activity.updatedAt  Date for when the activity info was last updated.
  * @apiSuccess {String} activities.activity.title  The title of the activity.
  * @apiSuccess {String} activities.activity.description  The description of the activity.
  */

  // Retrieve a single user with userId
  app.get('/users/:userId', (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    userService.getUserById(userId).then(user => {
      res.json(user);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

    /**
  * @api {get} /event/activities/ Get all activities during the event for user 
  * @apiName GetUserEventActivities
  * @apiGroup User
  *
  * @apiParam {Number} eventId The unique identifier of the event.
  * @apiParam {Number} userId The id for the current user 
  */

  // Get all activities during given event
  app.get('/users/:userId/events/:eventId/activities', (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    const eventId = req.params.eventId;
    userService.getUserEventActivities(userId, eventId).then(activities => {
      res.json(activities)
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

  /**
   * @api {get} /users/:userId/currentevent Get the current activity for user
   * @apiName GetCurrentEvent
   * @apiGroup User
   * 
   * @apiParam {Number} userId The unique identifier for the user. 
   */
  // Temporary endpoint until all events can be displayed in the app
  app.get('/users/:userId/currentevent', (req, res) => {
    const userId = req.params.userId;
    userService.getCurrentEvent(userId).then(event => {
      res.json(event);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
   });

  /**
  * @api {get} /users/:userId/notifications Get all updates made for the user's activities. Define number of returned notifications with query param limit.
  * Default limit is 10.
  * @apiName GetActivityUpdateNotifications
  * @apiGroup User
  * 
  * @apiParam {Number} userId The unique identifier for the user. 
 */
  app.get('/users/:userId/notifications', (req, res) => {
    const userId = req.params.userId;
    const limit = req.query.limit? req.query.limit: 10;
    userService.getActivityNotifications(userId, limit).then(logs => {
      res.json(logs);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })

  /**
  * @api {post} /user Create a new user profile
  * @apiName PostUser
  * @apiGroup User
  *
  * @apiParam {String} firstName First name of the user.
  * @apiParam {String} lastName Last name of the user.
  * @apiParam {String} phone Phonenumber of the user.
  * @apiParam {String} email The email of the user.
  */

  // Create a new user.
  app.post('/users', (req: express.Request, res: express.Response) => {
    const {companyId, ...userData} = req.body;
    userService.createUser(companyId, userData).then(user => {
      res.json(user)
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

    /**
   * @api {post} /users/:userId/playerId
   * @apiDescription Registers an OneSignal playerId for the user.
   * @apiName Add OneSignal playerId
   * @apiGroup User
   * @apiPermission Valid access token
   * 
   * @apiParam {string} playerId for the user.
   */
  app.post('/users/:userId/playerids', (req, res) => {
    const userId = req.params.userId;
    const playerId = req.body.playerId;
    userService.addPlayerId(userId, playerId).then(response => {
      res.json(response);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

/**
 * @api {post} /logout Logs out user.
 * @apiDescription Invalidates the refresh token.
 * @apiName Logout
 * @apiGroup User
 * @apiPermission Valid access token
 * 
 */
app.post('/logout', isAuthenticated, (req, res) => {
  const userId = req.decoded.userId;
  userService.logoutUser(userId).then(() => {
    res.status(204).send()
  }).catch(error => {
    const status = error.status? error.status : 500;
    res.status(status).send(error);
  })
})

/**
  * @api {put} /users/:userId/firstlogin First update when user log in for the first time
  * @apiDescription This route updates user informtaion and changes password when the user
  * logs in for the first time. Verification with token. 
  * @apiName FirstLogin
  * @apiGroup User
  * 
  * @apiParam {number} userId The unique identifier for the user
  * 
  * @apiParam {String} password The new password
  * @apiParam {String} firstName User first name
  * @apiParam {String} lastName User last name
  * @apiParam {String} email User email
  * @apiParam {String} phone User phone number
  * @apiParam {String} companyDepartment Department which the user belongs to
  */

  app.put('/users/:userId/firstlogin', uploadUserProfileImage, (req, res) => {
    const userId = req.params.userId;
    const {imageUrl, ...userData} = req.body;
    userService.firstUpdate(userId, userData, imageUrl).then(user => {
      res.json(user);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

  /**
  * @api {put} /users/:userid Update a single user-profile by id.
  * @apiName GetSingleUser
  * @apiGroup User
  *
  * @apiParam {Number} userId The unique id of the user.
  * 
  * @apiParam {String} firstName User first name
  * @apiParam {String} lastName User last name
  * @apiParam {String} email User email
  * @apiParam {String} phone User phone number
  * @apiParam {String} companyDepartment Department within the company user belongs to
  * @apiParam {String} aboutMe Description of user
  * @apiParam {String} allergiesOrPreferences User allergies or food preferences
  */

  // Update a user with userId
  app.put('/users/:userId', uploadUserProfileImage, (req, res) => {
    const userId = req.params.userId;
    const {imageUrl, ...userData} = req.body;
    userService.updateUser(userId, userData, imageUrl).then(user => {
      res.json(user);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
    // userController.updateUser(req, res).catch(error => {
    //   console.error("Error in updateUser:", error);
    //   res.status(500).send({
    //     type: error.name,
    //     message: "Error while updating user"
    //   })
    // });
  });

  /**
  * @api {delete} /users/:userid Delete a single user-profile by id.
  * @apiName DeleteSingleUser
  * @apiPermission ADMIN
  * @apiGroup User
  *
  * @apiParam {Number} userId The unique id of the user.
  */

  // FIXME: Needs to be locked down!
  // Delete a user with userId
  app.delete('/users/:userId', (req: express.Request, res: express.Response) => {
    const userId = req.params.userId;
    userService.deleteUser(userId).then(() => {
      res.status(204).send()
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });
   
  /**
 * @api {delete} /users/:userid/profileimage Deletes profile image for user.
 * @apiDescription Deletes the profile image for the user
 * @apiName Delete profileImage
 * @apiGroup User
 * @apiPermission Valid access token
 * 
 * @apiParam {number} userId The unique identifier for the user.
 */
  app.delete('/users/:userId/profileimage', (req, res) => {
    const userId = req.params.userId;
    userService.deleteProfileImage(userId).then(() => {
      res.status(204).send();
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

}


export default setUpUserRoutes;
