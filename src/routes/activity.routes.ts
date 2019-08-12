import * as express from 'express';
import * as activityController from '../controllers/activity.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpActivityRoutes(app) {

  // Middleware
  // app.use('/activities', (req, res, next) => {
  //   isAuthenticated(req, res, next);
  // })

  app.post('/activities', (req: express.Request, res: express.Response) => {
    activityController.createActivity(req, res);
  })

  app.post('/activities/:activityId/add-user', (req: express.Request, res: express.Response) => {
    activityController.addUserToActivity(req, res);
  })

  app.get('/activities', (req: express.Request, res: express.Response) => {
    activityController.getAllActivities(req, res);
  })

  app.delete('/activities/activityId', (req: express.Request, res: express.Response) => {
    activityController.deleteActivity(req, res);
  })

}

export default setUpActivityRoutes;
