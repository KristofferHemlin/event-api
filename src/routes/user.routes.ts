import * as express from 'express';
import * as userController from '../controllers/user.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpUserRoutes(app){

  // Middleware
  // app.use('/users', (req, res, next) => {
  //   isAuthenticated(req, res, next);
  // })

  // Create a new user.
  app.post('/users', (req: express.Request, res: express.Response) => {
    userController.createUser(req, res);
  });

  // Retrieve all users.
  app.get('/users', (req: express.Request, res: express.Response) => {
    userController.getAllUsers(req, res);
  });

  // Set up which company the user belongs to.
  app.post('/add-user-to-company', (req: express.Request, res: express.Response) => {
    userController.addCompanyToUser(req, res);
  });

  // Remove the company from the user.
  app.post('/remove-company-from-user', (req: express.Request, res: express.Response) => {
    userController.removeCompanyfromUser(req, res);
  });

  // Retrieve information for a single logged in user.
  app.get('/users/me', (req: express.Request, res: express.Response) => {
    userController.getUserInfoForCurrentUser(req, res);
  });

  // Retrieve a single user with userId
  app.get('/users/:userId', (req: express.Request, res: express.Response) => {
    userController.getUserById(req, res);
  });

  // Update a user with userId
  app.put('/users/:userId', (req: express.Request, res: express.Response) => {
    userController.updateUser(req, res);
  });

  // Delete a user with userId
  app.delete('/users/:userId', (req: express.Request, res: express.Response) => {
    userController.deleteUser(req, res);
  });

}

export default setUpUserRoutes;
