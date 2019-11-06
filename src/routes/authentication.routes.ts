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
    authenticationController.authenticateUser(req, res).catch(error => {
      console.error("Error in authenticateUser: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not authenticate user"
      })
    });
  });


  /**
   * @api {post} /tokens/refresh Refresh access and refresh tokens
   * @apiDescription Refreshes access token and updates refresh token.
   * 
   * @apiGroup Authentication
   * 
   * @apiParam {String} (body parameter) refreshToken User refresh token
   * @apiParam {String} (body parameter) userId User unique id
   */
  app.post('/tokens/refresh', (req, res) => {
    authenticationController.refreshToken(req, res).catch(error => {
      console.error("Error in refeshToken: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not refresh token"
      })
    });
  })

  /**
   * @api {get} /tokens/validate Validate access token
   * @apiDescription Validates current access token in auth header
   * 
   * @apiGroup Authentication
   */ 
  app.get('/tokens/validate', (req, res) => {
    authenticationController.validateAccessToken(req, res).catch(error => {
      console.error("Error in validateAccessToken: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not validate access token"
      })
    });
  })


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
    authenticationController.signUpNewUser(req, res).catch(error => {
      console.error("Error in signUpNewUser: ", error);
      res.status(500).send({
        type: error.name,
        message: "Could not sign up new user"
      })
    });
  });


/**
  * @api {put} /account/password Change user password
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
  app.put('/account/password', 
    isAuthenticated,
    (req, res) => {
      authenticationController.changeUserPassword(req, res).catch(error => {
        console.error("Error in changeUserPassword: ", error);
        res.status(500).send({
          type: error.name,
          message: "Error while changing user password"
        })
      });
    });

  
    /**
    * @api {post} /resetpassword Request mail with reset password url
    *
    * @apiDescription This route sends an email with reset token to user, if the email is registered.
    *
    * @apiName ResetPasswordEmailRequest
    * @apiGroup Authentication
    *
    * @apiParam {String} email The user email
    */  

  app.post('/resetpassword', (req, res) => {
    authenticationController.sendResetPasswordEmail(req, res).catch(error => {
      console.error("Error in sendResetPasswordEmail: ", error);
      res.status(500).send({
        type: error.name,
        message: "Error while sending reset password email."
      })
    })
  })


  app.get('/deeplink/:token', (req, res) => {
    authenticationController.redirectDeepLink(req, res).catch(error => {
      console.error("Error in redirectDeepLink: ", error); // Not sure where to redirect if this fails.
    })
  })

  /**
  * @api {post} /resetpassword/:token Reset password for user
  *
  * @apiDescription This route changes user password if token is valid.
  *
  * @apiName ResetPassword
  * @apiGroup Authentication
  *
  * @apiParam {String} token Token from reset password email
  * @apiParam {String} password New password
  */  
  app.post('/resetpassword/:token', (req, res) => {
    authenticationController.resetPassword(req, res).catch(error => {
      console.error("Error in resetPasswrd: ", error);
      res.status(500).send("Error while trying to change password");
    })
  })
}

export default setUpAuthenticationRoutes;
