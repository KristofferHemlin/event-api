import * as express from 'express';
import * as companyController from '../controllers/company.controller';
import isAuthenticated from '../middleware/isAuthenticated';

function setUpCompanyRoutes(app){

  // Middleware
  // app.use('/companies', (req, res, next) => {
  //   isAuthenticated(req, res, next);
  // })

  // Create a new company.
  app.post('/companies', (req: express.Request, res: express.Response) => {
    companyController.createCompany(req, res);
  });

  // Retrieve all companies.
  app.get('/companies', (req: express.Request, res: express.Response) => {
    companyController.getAllCompanies(req, res);
  });

  // Retrieve a single company with companyId
  app.get('/companies/:companyId', (req: express.Request, res: express.Response) => {
    companyController.getCompanyById(req, res);
  });

  // Update a company with companyId
  app.put('/companies/:companyId', (req: express.Request, res: express.Response) => {
    companyController.updateCompany(req, res);
  });

  // Remove a user from a company
  app.delete('/companies/:companyId/remove-user', (req: express.Request, res: express.Response) => {
    companyController.removeUserFromCompany(req, res);
  });

  // Delete a company with companyId
  app.delete('/companies/:companyId', (req: express.Request, res: express.Response) => {
    companyController.deleteCompany(req, res);
  });

}

export default setUpCompanyRoutes;
