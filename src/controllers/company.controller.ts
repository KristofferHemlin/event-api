import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Event from '../entities/event.entity';
import {getRepository, createQueryBuilder, getTreeRepository} from "typeorm";

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
  await getRepository(Company).find({relations: ['employees', 'events', 'activities'], order: {id: "ASC"}})
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

export async function updateCompany(req, res) {
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

export async function removeUserFromCompany(req, res) {
  let theCompany = await getRepository(Company).findOne({ id: req.params.companyId }, {relations: ['employees', 'events']});
  let theUser = await getRepository(User).findOne({ id: req.body.id }, {relations: ['events', 'activities', 'company']});

  // Check if the company exists.
  if(!theCompany){
    return res.send({
      message: 'No company with that id exists.'
    });
  }

  // Check if the user exists.
  if(!theUser){
    return res.send({
      message: 'No user with that id exists.'
    });
  }

  // Check if the user belongs to the company.
  if (theCompany.employees.find(employee => employee.id == theUser.id)){

    // Reset all underlying data.
    theUser.company = null;
    theUser.events = null;
    theUser.activities = null;

    getRepository(User).save(theUser)
    .then(response => {
      return res.send({
        message: `The user ${theUser.firstName} ${theUser.lastName} was removed from the company ${theCompany.title}.`
      })
    })
    .catch(error => {
      return res.send(error);
    })
  } else {
    return res.send({
      message: 'User was not found in the company!',
    })
  }
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

export async function getAllEventsForaCompany(req, res) {

  // If the user is an admin use the companyId param, 
  // else use the req.decoded.companyId param.

  const events = await getRepository(Event)
    .createQueryBuilder()
    .leftJoinAndSelect("Event.company", "company")
    .where("Event.company.id = :companyId", { companyId: req.params.companyId })
    .orderBy("Event.id", "ASC")
    .getMany()
  res.status(200).send(events)
}

export async function getAllUsersForACompany(req, res) {
  const users = await getRepository(User)
  .createQueryBuilder()
  .leftJoinAndSelect("User.company", "company")
  .where("User.company.id = :companyId", { companyId: req.params.companyId })
  .orderBy("User.id", "ASC")
  .getMany()

  res.status(200).send(users);
}
