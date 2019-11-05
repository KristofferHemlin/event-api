import * as express from 'express';
import * as companyController from '../controllers/company.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpCompanyRoutes(app){

  // Middleware
  app.use('/companies', (req, res, next) => {
    isAuthenticated(req, res, next);
  })



  /**
  * @api {post} /companies Create a new company
  * @apiPermission Admin & Company Manager
  * @apiName CreateCompany
  * @apiGroup Company
  * @apiDeprecated This is handled by (#Authentication:SignUpNewUser)
  */

  // Create a new company.
  app.post('/companies', (req: express.Request, res: express.Response) => {
    companyController.createCompany(req, res);
  });



  /**
  * @api {get} /companies Get all companies
  * @apiPermission Admin
  * @apiName GetAllCompanies
  * @apiGroup Company
  */

  // Retrieve all companies.
  app.get('/companies', (req: express.Request, res: express.Response) => {
    companyController.getAllCompanies(req, res);
  });



  /**
  * @api {get} /companies/:companyId Get a single company by id
  *
  * @apiDescription Will get the data for a single company.
  * Admins can get any company, while all other roles can only fetch the data
  * for a company where they are a member.
  *
  * @apiPermission Authenticated user - Admin, Company Manager, Company Member.
  * @apiName GetSingleCompany
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  */

  // Retrieve a single company with companyId
  app.get('/companies/:companyId', (req: express.Request, res: express.Response) => {
    companyController.getCompanyById(req, res);
  });



  /**
  * @api {put} /companies/:companyId Update a single company by id
  * @apiPermission Authenticated User - Admin, Company Manager
  * @apiName UpdateSingleCompany
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  * @apiParam {String} title The title of the company.
  */

  // Update a company with companyId
  app.put('/companies/:companyId', (req: express.Request, res: express.Response) => {
    companyController.updateCompany(req, res);
  });


  /**
  * @api {delete} /companies/:companyId/remove-user Remove a single user from a company by id
  * @apiPermission Authenticated User - Admin, Company Manager
  * @apiName RemoveSingleUserFromCompany
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  * @apiParam {Number} userId The unique identifier of the user.
  */

  // Remove a user from a company
  app.delete('/companies/:companyId/remove-user', (req: express.Request, res: express.Response) => {
    companyController.removeUserFromCompany(req, res);
  });



  /**
  * @api {delete} /companies/:companyId Delete a company by id
  * @apiPermission Authenticated User - Admin, Company Manager
  * @apiName DeleteCompany
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  */

  // Delete a company with companyId
  app.delete('/companies/:companyId', (req: express.Request, res: express.Response) => {
    companyController.deleteCompany(req, res);
  });


  /**
  * @api {get} /companies/:companyId/events Get all events for a company
  * @apiPermission Authenticated User - Admin, Company Manager, Company Member
  * @apiName GetCompanyEvents
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  */


  // Get all events for a company.
  app.get('/companies/:companyId/events', (req: express.Request, res: express.Response) => {
    companyController.getAllEventsForCompany(req, res);
  })

  app.get('/companies/:companyId/users',(req: express.Request, res: express.Response) => {
    companyController.getAllUsersForCompany(req, res);
  }) 


}

export default setUpCompanyRoutes;
