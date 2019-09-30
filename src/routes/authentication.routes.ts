import * as express from 'express';
import * as authenticationController from '../controllers/authentication.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpAuthenticationRoutes(app){

  /**
  * @api {post} /authenticate Authenticate user credentials
  *
  * @apiDescription Authenticates the user credentials and send back a token.
  * The token needs to saved in the client, and then sent in on all sub-sequent
  * api calls that require the user to be authenticated.
  *
  * @apiPermission Public / Everyone
  * @apiName AuthenticateUserCredentials
  * @apiGroup Authentication
  *
  * @apiParam {String} email  The user email.
  * @apiParam {String} password  The password for the user.
  */

  // Authenticate user.
  app.post('/authenticate', (req: express.Request, res: express.Response) => {
    authenticationController.authenticateUser(req, res);
  });



  /**
  * @api {post} /sign-up-new-user Sign up a new user
  *
  * @apiDescription This route signs up a new user with an user-profile, role and company.
  *
  * @apiPermission Public / Everyone
  * @apiName SignUpNewUser
  * @apiGroup Authentication
  *
  * @apiParam {String} email  The user email.
  * @apiParam {String} password  The password for the user.
  * @apiParam {String} firstName The users given name.
  * @apiParam {String} lastName The users surname.
  * @apiParam {String} phone The users phonenumber.
  * @apiParam {String} title The company title.
  */

  // Sign up new user.
  app.post('/sign-up-new-user', (req: express.Request, res: express.Response) => {
    authenticationController.signUpNewUser(req, res);
  });


/**
  * @api {post} /account/:userId/password Change user password
  *
  * @apiDescription This route changes the password for the current user. Verification with token.
  *
  * @apiName ChangeUserPassword
  * @apiGroup Authentication
  *
  * @apiParam {String} currentPassword The current user password
  * @apiParam {String} newPassword The new password
  */

  // Change password
  app.post('/account/password', 
    isAuthenticated,
    (req, res) => {
      authenticationController.changeUserPassword(req, res);
    });
}

export default setUpAuthenticationRoutes;
