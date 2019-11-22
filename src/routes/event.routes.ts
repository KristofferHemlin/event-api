import * as express from 'express';
import isAuthenticated from '../middleware/isAuthenticated';
import EventService from '../services/EventService';
import { getSortingParams, removeImages } from '../modules/helpers';
import { uploadEventCoverImage, compressCoverImage } from '../middleware/fileUploads';
import { cleanAndValidateEvent } from '../middleware/inputValidation';

function setUpEventRoutes(app) {
  const eventService = new EventService();

  // Middleware
  app.use('/events', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

  app.use('/v1/events', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

    /**
  * @api {get} /event Get all events
  * @apiDescription This route fetches all events of a company if your an Admin
  * or Company Manager. If you're a Company member you will only get the events
  * that you are participating in. ( Not yet implemented )
  * @apiPermission Authenticated - Admin
  * @apiName GetAllEvents
  * @apiGroup Event
  */

  // Fetch all events.
  app.get('/events', (req: express.Request, res: express.Response) => {
    eventService.getEvents().then(events => {
      res.json(events);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

  /**
   * @api {get} Fetch event by its id
   * @apiName GetEventById
   * @apiGroup Event
   * 
   * @apiParam {number} eventId Unique identifier for the parent company.
   */
  app.get('/events/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    eventService.getEvent(eventId).then(event => {
      res.json(event);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

    /**
   * @api {get} /events/:eventId/users
   * @apiDescription This route fetches all user for the specified event. Specify sort order by /events/:eventId/users?sort=firstName:asc
   * @apiName GetEventParticipants
   * @apiGroup Event
   * @apiParam {Number} eventId Unique identifier for the event
   */

  // Fetch all users on an event
  app.get("/events/:eventId/users", (req, res) => {
    const eventId = req.params.eventId;
    const sortingParams = getSortingParams(req);
    eventService.getEventParticipants(eventId, sortingParams).then(participants => {
      res.json(participants);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
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
    const eventId = req.params.eventId;
    const sortingParams = getSortingParams(req);
    const limit = req.query.limit? parseInt(req.query.limit): 100;
    const offset = req.query.offset? parseInt(req.query.offset): 0;
    const search = req.query.search;
    const requestPath = req.url;
    eventService.getEventParticipantsV1(eventId, sortingParams, limit, offset, search, requestPath).then(message => {
      res.json(message);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

    /**
   * @api {get} /events/:eventId/activities
   * @apiDescription This route fetches all activities for the specified event.
   * @apiName GetEventActivities
   * @apiGroup Event
   * 
   * @apiParam {Number} eventId Unique identifier for the event.
   */

  app.get("/events/:eventId/activities", (req, res) => {
    const eventId = req.params.eventId;
    eventService.getEventActivities(eventId).then(activities => {
      res.json(activities)
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

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
  app.post('/events', uploadEventCoverImage, cleanAndValidateEvent, compressCoverImage, 
  (req: express.Request, res: express.Response) => {
    const {companyId, imageUrl, ...newEvent} = req.body;
    eventService.createEvent(newEvent, companyId, imageUrl).then(event => {
      res.json(event);
    }).catch(error => {
      removeImages(imageUrl);
      const status = error.status? error.status : 500;
      res.status(status).send(error);
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
  app.put('/events/:eventId/users/:userId', (req: express.Request, res: express.Response) => {
    const eventId = req.params.eventId;
    const userId = req.params.userId;
    eventService.addEventParticipant(eventId, userId).then(response => {
      res.json(response);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })

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
  app.put('/events/:eventId', uploadEventCoverImage, cleanAndValidateEvent, compressCoverImage, 
  (req: express.Request, res: express.Response) => {
    const eventId = req.params.eventId;
    const {imageUrl, ...eventData} = req.body;
    eventService.updateEvent(eventId, eventData, imageUrl).then(event => {
      res.json(event);
    }).catch(error => {
      removeImages(imageUrl);
      const status = error.status? error.status : 500;
      res.status(status).send(error);
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
  app.delete('/events/:eventId/users/:userId', (req: express.Request, res: express.Response) => {
    const eventId = parseInt(req.params.eventId);
    const userId = parseInt(req.params.userId);
    eventService.removeEventParticipant(eventId, userId).then(() => {
      res.status(204).send();
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
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
    const eventId = req.params.eventId;
    eventService.deleteEvent(eventId).then(() => {
      res.status(204).send();
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  })

  /**
  * @api {delete} /event/:eventId/coverimage Delete an event coverimage
  * @apiPermission Authenticated User - Admin, Company Manager
  * @apiName DeleteEventCoverImage
  * @apiGroup Event
  *
  * @apiParam {Number} eventId The unique identifier of the event.
  */
  // Delete event cover image
  app.delete('/events/:eventId/coverimage', (req, res) => {
    const eventId = req.params.eventId;
    eventService.deleteCoverImage(eventId).then(() => {
      res.status(204).send();
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })

}

export default setUpEventRoutes;
