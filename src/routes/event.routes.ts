import * as express from 'express';
import * as eventController from '../controllers/event.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpEventRoutes(app) {


  // Middleware
  app.use('/events', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

  /**
  * @api {post} /event Create a new event
  * @apiPermission Admin & Company Manager
  * @apiName CreateEvents
  * @apiGroup Event
  *
  * @apiParam {Number} companyId Unique identifier for the parent company.
  * @apiParam {String} title The title of the event.
  * @apiParam {String} description The description of the event.
  * @apiParam {String} startTime (YYYY-MM-DD HH:MM) Date and time when the event starts.
  * @apiParam {String} endTime (YYYY-MM-DD HH:MM) Date and time when the event ends.
  * @apiParam {String} location Event location.
  * @apiParam {String} goodToKnow Info that is good to know. 
  */

  // Create a new event.
  app.post('/events', (req: express.Request, res: express.Response) => {
    eventController.createEvent(req, res);
  });



  /**
  * @api {put} /event Update an event
  * @apiPermission Admin & Company Manager (or user set to organizer of the event.)
  * @apiName UpdateEvent
  * @apiGroup Event
  *
  * @apiParam {Number} eventId Unique identifier for the event.
  * 
  * @apiParam {String} title The title of the event.
  * @apiParam {String} description The description of the event.
  * @apiParam {String} startTime (YYYY-MM-DD HH:MM) Date and time when the event starts.
  * @apiParam {String} endTime (YYYY-MM-DD HH:MM) Date and time when the event ends.
  * @apiParam {String} location Event location.
  * @apiParam {String} goodToKnow Info that is good to know.
  */

  // Update an event.
  app.put('/events/:eventId', (req: express.Request, res: express.Response) => {
    eventController.updateEvent(req, res);
  })



  /**
  * @api {get} /event Get all events
  * @apiDescription This route fetches all events of a company if your an Admin
  * or Company Manager. If you're a Company member you will only get the events
  * that you are participating in. ( Not yet implemented )
  * @apiPermission Authenticated - All roles
  * @apiName GetAllEvents
  * @apiGroup Event
  */

  // Fetch all events.
  app.get('/events', (req: express.Request, res: express.Response) => {
    eventController.getAllEvents(req, res);
  });

  /**
   * @api {get} /events/:eventId/users
   * @apiDescription This route fetches all user for the specified event. 
   * @apiName GetEventParticipants
   * @apiGroup Event
   * @apiParam {Number} eventId Unique identifier for the event
   */

  // Fetch all users on an event
  app.get("/events/:eventId/users", eventController.getEventParticipants);


  /**
   * @api {get} /events/:eventId/activities
   * @apiDescription This route fetches all activities for the specified event.
   * @apiName GetEventActivities
   * @apiGroup Event
   * 
   * @apiParam {Number} eventId Unique identifier for the event.
   */

   app.get("/events/:eventId/activities", eventController.getEventActivities);

  /**
  * @api {post} /event/add-user Add a user to an event
  * @apiDescription Adds
  * @apiPermission Authenticated User - Admin, Company Manager (or user set to organizer of the event.)
  * @apiName AddAUserToEvent
  * @apiGroup Event
  */

  // Add a user to an Event.
  app.post('/events/add-user', (req: express.Request, res: express.Response) => {
    eventController.addUserToEvent(req, res);
  })



  /**
  * @api {delete} /event/remove-user Remove a user from an event
  * @apiPermission Authenticated User - Admin, Company Manager (or user set to organizer of the event.)
  * @apiName RemoveUserFromEvent
  * @apiGroup Event
  *
  * @apiParam {Number} eventId The unique identifier of the event.
  * @apiParam {Number} userId The unique identifier of the user.
  */

  // Remove a user from an event.
  app.delete('/events/remove-user', (req: express.Request, res: express.Response) => {
    eventController.removeUserFromEvent(req, res);
  })



  /**
  * @api {delete} /event/:eventId Delete an event
  * @apiPermission Authenticated User - Admin, Company Manager
  * @apiName DeleteEvent
  * @apiGroup Event
  *
  * @apiParam {Number} eventId The unique identifier of the event.
  */

  // Delete an event.
  app.delete('/events/:eventId', (req: express.Request, res: express.Response) => {
    eventController.deleteEvent(req, res);
  })

}

export default setUpEventRoutes;
