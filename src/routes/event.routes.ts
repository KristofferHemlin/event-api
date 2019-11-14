import * as express from 'express';
import * as eventController from '../controllers/event.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpEventRoutes(app) {


  // Middleware
  app.use('/events', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

  app.use('/v1/events', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

  /**
   * @api {get} Fetch event by its id
   * @apiName GetEventById
   * @apiGroup Event
   * 
   * @apiParam {number} eventId Unique identifier for the parent company.
   */
  app.get('/events/:eventId', (req, res) => {
    eventController.getEventById(req, res).catch(error => {
      console.error("Error in getEventById: ", error);
      res.status(500).send({
        type: error.name, 
        message: "Error while fetching event"
      })
    })
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
    eventController.createEvent(req, res).catch(error => {
      console.error("Error in creteEvent: ", error);
      res.status(500).send({
        type: error.name, 
        message: "Error while creating event"
      })
    });
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
    eventController.updateEvent(req, res).catch(error => {
      console.error("Error in updateEvent: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while updating event"
      })
    });
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
    eventController.getAllEvents(req, res).catch(error => {
      console.error("Error in getAllEvents: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching all events"
      })
    });
  });

  /**
   * @api {get} /events/:eventId/users
   * @apiDescription This route fetches all user for the specified event. Specify sort order by /events/:eventId/users?sort=firstName:asc
   * @apiName GetEventParticipants
   * @apiGroup Event
   * @apiParam {Number} eventId Unique identifier for the event
   */

  // Fetch all users on an event
  app.get("/events/:eventId/users", (req, res) => {
    eventController.getEventParticipants(req, res).catch(error => {
      console.error("Error in getEventParticipants: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching event participants"
      })
    })
  });

  // New version that implements pagination
  /**
   * @api {get} /v1/events/:eventId/users
   * @apiDescription This route fetches all user for the specified event. 
   * Query params: sort=column:order, offset=record to skip (number), limit=limit (default 100) of number of records returned (number)
   *  search=text to match firstName, lastName or company department with
   * Example: /v1/events/:eventId/users?sort=firstName:asc&offset=3&limit=10
   * @apiName GetEventParticipantsV1
   * @apiGroup Event
   * @apiParam {Number} eventId Unique identifier for the event
   */
  app.get("/v1/events/:eventId/users", (req, res) => {
    eventController.getEventParticipantsV1(req, res).catch(error => {
      console.error("Error in getEventParticipants:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching event participants"
      })
    })
  })

  /**
  * @api {get} /events/:eventId/users/:userId
  * @apiDescription This route fetches a single user for the specified event.
  * @apiName GetSingleEventParticipant
  * @apiGroup Event
  * @apiParam {Number} eventId Unique identifier for the event
  * @apiParam {Number} userId Unique identifier for the event
  */

  app.get("/events/:eventId/users/:userId", (req, res) => {
    eventController.getEventParticipant(req, res).catch(error => {
      console.error("Error in getEventParticipant: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching error participant"
      })
    })
  });


  /**
   * @api {get} /events/:eventId/activities
   * @apiDescription This route fetches all activities for the specified event.
   * @apiName GetEventActivities
   * @apiGroup Event
   * 
   * @apiParam {Number} eventId Unique identifier for the event.
   */

   app.get("/events/:eventId/activities", (req, res) => {
     eventController.getEventActivities(req, res).catch(error => {
       console.error("Error in getEventActivities: ", error)
       res.status(500).send({
         type: error.name,
         message: "Error while fetching event activities"
       })
     })
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
    eventController.addUserToEvent(req, res).catch(error => {
      console.error("Error in addUserToEvent: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while adding user to event"
      })
    });
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
    eventController.removeUserFromEvent(req, res).catch(error => {
      console.error("Error in removeUserFromEvent: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while removing user from event"
      })
    });
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
    eventController.deleteEvent(req, res).catch(error => {
      console.error("Error in deleteEvent: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while deleting event"
      })
    });
  })

  app.delete('/events/:eventId/coverimage', (req, res) => {
    eventController.deleteCoverImage(req, res).catch(error => {
      console.error("Error in deleteCoverImage: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while deleting cover image"
      })
    })
  })

}

export default setUpEventRoutes;
