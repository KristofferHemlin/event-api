import * as express from 'express';
import * as authenticationController from '../controllers/authentication.controller';

function setUpAuthenticationRoutes(app){

  // Authenticate user.
  app.post('/authenticate', (req: express.Request, res: express.Response) => {
    authenticationController.authenticateUser(req, res);
  });

  // Sign up new user.
  app.post('/sign-up-new-user', (req: express.Request, res: express.Response) => {
    authenticationController.signUpNewUser(req, res);
  });

}

export default setUpAuthenticationRoutes;
