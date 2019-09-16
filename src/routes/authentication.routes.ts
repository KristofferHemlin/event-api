import * as express from 'express';
import * as authenticationController from '../controllers/authentication.controller';

function setUpAuthenticationRoutes(app){

  /**
  * @api {post} /authenticate Authenticate account credentials
  *
  * @apiDescription Authenticates the user credentials and send back a token.
  * The token needs to saved in the client, and then sent in on all sub-sequent
  * api calls that require the user to be authenticated.
  *
  * @apiPermission Public / Everyone
  * @apiName AuthenticateUserCredentials
  * @apiGroup Authentication
  *
  * @apiParam {String} email  The account email.
  * @apiParam {String} password  The password for the account.
  */

  // Authenticate user.
  app.post('/authenticate', (req: express.Request, res: express.Response) => {
    authenticationController.authenticateUser(req, res);
  });



  /**
  * @api {post} /sign-up-new-user Sign up a new user account
  *
  * @apiDescription This route signs up a new user with an account, user-profile and company.
  * (A role will be added at a later stage.)
  *
  * @apiPermission Public / Everyone
  * @apiName SignUpNewUser
  * @apiGroup Authentication
  *
  * @apiParam {String} email  The account email.
  * @apiParam {String} password  The password for the account.
  * @apiParam {String} firstName The users given name.
  * @apiParam {String} lastName The users surname.
  * @apiParam {String} phone The users phonenumber.
  * @apiParam {String} title The company title.
  */

  // Sign up new user.
  app.post('/sign-up-new-user', (req: express.Request, res: express.Response) => {
    authenticationController.signUpNewUser(req, res);
  });

}

export default setUpAuthenticationRoutes;
