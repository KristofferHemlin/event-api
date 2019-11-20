import * as express from 'express';
import isAuthenticated from '../middleware/isAuthenticated';
import CompanyService from '../services/CompanyService';

function setUpCompanyRoutes(app){
  const companyService = new CompanyService();
  // Middleware
  app.use('/companies', (req, res, next) => {
    isAuthenticated(req, res, next);
  })

    /**
  * @api {get} /companies Get all companies
  * @apiPermission Admin
  * @apiName GetAllCompanies
  * @apiGroup Company
  */

  // Retrieve all companies.
  app.get('/companies', (req: express.Request, res: express.Response) => {
    companyService.getCompanies().then(companies => {
      res.json(companies);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
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
      const companyId = req.params.companyId;
      companyService.getCompanyById(companyId).then(company => {
        res.json(company);
      }).catch(error => {
        const status = error.status? error.status : 500;
        res.status(status).send(error);
      })
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
    const companyId = req.params.companyId;
    companyService.getCompanyEvents(companyId).then(events => {
      res.json(events)
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
    
    // companyController.getAllEventsForCompany(req, res).catch(error => {
    //   console.error("Error in getAllEventsForCompany: ", error);
    //   res.status(500).send({
    //     type: error.name, 
    //     message: "Error while fetching company events"
    //   })
    // });
  })

  /**
  * @api {get} /companies/:companyId/users Get all users for a company
  * @apiPermission Authenticated User - Admin, Company Manager
  * @apiName GetCompanyUsers
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  */
  app.get('/companies/:companyId/users',(req: express.Request, res: express.Response) => {
    const companyId = req.params.companyId;
    companyService.getCompanyEmployees(companyId).then(employees => {
      res.json(employees);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    });
  })


  /**
  * @api {post} /companies Create a new company
  * @apiPermission Admin
  * @apiName CreateCompany
  * @apiGroup Company
  * 
  * @apiParam {String} title The company title
  */

  // Create a new company.
  app.post('/companies', (req: express.Request, res: express.Response) => {
    companyService.createCompany(req.body).then(company => {
      res.json(company);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
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
    const companyId = req.params.companyId;
    companyService.updateCompany(companyId, req.body).then(company => {
      res.json(company);
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  });

  /**
  * @api {delete} /companies/:companyId Delete a company by id. Removes all users associated with the company.
  * @apiPermission Admin, Company Manager
  * @apiName DeleteCompany
  * @apiGroup Company
  *
  * @apiParam {Number} companyId The unique identifier of the company.
  */

  // Delete a company with companyId
  app.delete('/companies/:companyId', (req: express.Request, res: express.Response) => {
    const companyId = req.params.companyId;
    companyService.deleteCompany(companyId).then(() => {
      res.status(204).send();
    }).catch(error => {
      const status = error.status? error.status : 500;
      res.status(status).send(error);
    })
  }); 

}

export default setUpCompanyRoutes;
