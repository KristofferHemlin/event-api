import Company from '../entities/company.entity';
import {getRepository} from "typeorm";

export async function createCompany(req, res) {

  let company = new Company();
  company.title = req.body.title;

  await getRepository(Company).save(company)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function getAllCompanies(req, res) {
  await getRepository(Company).find({relations: ['employees', 'events']})
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function getCompanyById(req, res) {
  await getRepository(Company).findOne({ id: req.params.companyId })
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function updateCompany(req, res){
  let companyToUpdate = await getRepository(Company).findOne({ id: req.params.companyId });

  companyToUpdate.title = req.body.title;

  await getRepository(Company).save(companyToUpdate)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function deleteCompany(req, res){
  let company = await getRepository(Company).findOne({ id: req.params.companyId });
  await getRepository(Company).remove(company)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}
