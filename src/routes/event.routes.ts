import * as express from 'express';
import * as userController from '../controllers/event.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpEventRoutes(app) {


  // Middleware
  // app.use('/events', (req, res, next) => {
  //   isAuthenticated(req, res, next);
  // })


  // Create a new event.
  app.post('/events', (req: express.Request, res: express.Response) => {
    userController.createEvent(req, res);
  });

  // Update an event.
  app.put('/events', (req: express.Request, res: express.Response) => {
    userController.updateEvent(req, res);
  })

  // Fetch all events.
  app.get('/events', (req: express.Request, res: express.Response) => {
    userController.getAllEvents(req, res);
  });

  // Add a user to an Event.
  app.post('/events/add-user', (req: express.Request, res: express.Response) => {
    userController.addUserToEvent(req, res);
  })

  // Remove a user from an event.
  app.delete('/events/remove-user', (req: express.Request, res: express.Response) => {
    userController.removeUserFromEvent(req, res);
  })

  // Delete an event.
  app.delete('/events/:eventId', (req: express.Request, res: express.Response) => {
    userController.deleteEvent(req, res);
  })

}

export default setUpEventRoutes;
