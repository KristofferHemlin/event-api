import * as express from 'express';
import isAuthenticated from '../middleware/isAuthenticated';
import AuthenticationService from '../services/AuthenticationService';
import {processFormDataWithoutFile} from '../middleware/fileUploads';

function setUpAuthenticationRoutes(app){
  const authenticationService = new AuthenticationService();
  
  /**
   * @api {get} /tokens/validate Validate access token
   * @apiDescription Validates current access token in auth header
   * 
   * @apiGroup Authentication
   */ 
  app.get('/tokens/validate', (req, res) => {
    const token = req.headers.authorization;
    authenticationService.validateAccessToken(token).then(() => {
      res.status(204).send();
    }).catch(error => {
      const status = error.status? error.status: 500;
      res.status(status).send(error);
    })
  })
  
  /**
   * @api {get} /deepling/:token Redirect user with a deep link
   * @apiName RedirectDeepLink
   * @apiGroup Authentication
   * 
   * @apiParam {String} token Token from reset password email.
   */
  app.get('/deeplink/:token', (req, res) => {
    // Needed because evently:// does not become a valid hyperlink.
    const token = req.params.token;
    res.redirect('evently://resetpassword/'+token);
  })
  
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
    const email = req.body.email;
    const password = req.body.password;
    authenticationService.authenticateUser(email, password).then(user => {
      res.json(user);
    }).catch(error => {
      const status = error.status? error.status: 500;
      res.status(status).send(error);
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
    const userId = parseInt(req.body.userId);
    const refreshToken = req.body.refreshToken;
    authenticationService.refreshToken(userId, refreshToken).then(tokens => {
      res.json(tokens);
    }).catch(error => {
      const status = error.status? error.status: 500;
      res.status(status).send(error);
    })
  })

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
    const email = req.body.email;
    authenticationService.sendResetPasswordEmail(email).then(response => {
      res.json(response);
    }).catch(error => {
      const status = error.status? error.status: 500;
      res.status(status).send(error);
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
    const token = req.params.token;
    const password = req.body.password;
    authenticationService.resetPassword(token, password).then(response => {
        res.json(response);
    }).catch(error => {
      const status = error.status? error.status: 500;
      res.status(status).send(error);
    })
  //   authenticationController.resetPassword(req, res).catch(error => {
  //     console.error("Error in resetPasswrd: ", error);
  //     res.status(500).send({
  //       type: error.name,
  //       message: "Error while trying to change password"});
  //   })
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
  app.post('/signup', (req: express.Request, res: express.Response) => {
    const {title, ...userData} = req.body;
    authenticationService.signUpNewUser(userData, title).then(user => {
      res.json(user)
    }).catch(error => {
      const status = error.status? error.status: 500;
      res.status(status).send(error);
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
    isAuthenticated, processFormDataWithoutFile,(req, res) => {
      const {currentPassword, newPassword} = req.body;
      const userId = parseInt(req.decoded.userId);
      authenticationService.changeUserPassword(userId, currentPassword, newPassword).then(response => {
        res.json(response)
      }).catch(error => {
        const status = error.status? error.status: 500;
        res.status(status).send(error);
      })
    });
}

export default setUpAuthenticationRoutes;
