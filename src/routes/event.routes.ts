import * as express from 'express';
import * as userController from '../controllers/event.controller';
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
  */

  // Create a new event.
  app.post('/events', (req: express.Request, res: express.Response) => {
    userController.createEvent(req, res);
  });



  /**
  * @api {put} /event Update an event
  * @apiPermission Admin & Company Manager (or user set to organizer of the event.)
  * @apiName UpdateEvent
  * @apiGroup Event
  *
  * @apiParam {Number} eventId Unique identifier for the event.
  * @apiParam {String} title The title of the event.
  * @apiParam {String} description The description of the event.
  */

  // Update an event.
  app.put('/events', (req: express.Request, res: express.Response) => {
    userController.updateEvent(req, res);
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
    userController.getAllEvents(req, res);
  });


  /**
  * @api {post} /event/add-user Add a user to an event
  * @apiDescription Adds
  * @apiPermission Authenticated User - Admin, Company Manager (or user set to organizer of the event.)
  * @apiName AddAUserToEvent
  * @apiGroup Event
  */

  // Add a user to an Event.
  app.post('/events/add-user', (req: express.Request, res: express.Response) => {
    userController.addUserToEvent(req, res);
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
    userController.removeUserFromEvent(req, res);
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
    userController.deleteEvent(req, res);
  })

}

export default setUpEventRoutes;
