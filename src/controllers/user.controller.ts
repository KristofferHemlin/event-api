import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import {getRepository} from "typeorm";

export async function createUser(req, res) {

  let user = new User();
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.phone = req.body.phone;
  user.email = req.body.email;
  user.isActive = false;

  await getRepository(User).save(user)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function getAllUsers(req, res) {
 await getRepository(User).find({relations: ['company', 'events', 'activities']})
 .then(response => {
  res.send(response);
 })
 .catch(error => {
  res.send(error);
 })
}

export async function getUserInfoForCurrentUser(req, res) {
  console.log('decoded:', req.decoded);
  await getRepository(User).findOne({ id: req.decoded.user_id }, {relations: ['company', 'activities', 'events']})
  .then(user => {
    res.send(user);
  })
  .catch(error => {
    res.send(error);
  })
}


export async function getUserById(req, res){
  await getRepository(User).findOne({ id: req.params.userId }, {relations: ['company', 'activities', 'events']})
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function updateUser(req, res){
  let userToUpdate = await getRepository(User).findOne({ id: req.params.userId });

  userToUpdate.firstName = req.body.firstName;
  userToUpdate.lastName = req.body.lastName;
  userToUpdate.phone = req.body.phone;
  userToUpdate.email = req.body.email;

  await getRepository(User).save(userToUpdate)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function deleteUser(req, res){
  let user = await getRepository(User).findOne({ id: req.params.userId });
  await getRepository(User).remove(user)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    res.send(error);
  })
}

export async function addCompanyToUser(req, res){
  let user = await getRepository(User).findOne({ id: req.body.userId });
  let company = await getRepository(Company).findOne({ id: req.body.companyId });

  user.company = company;

  await getRepository(User).save(user)
  .then(response => {
    res.send({
      message: `User ${user.firstName} ${user.lastName} was successfully added to the company ${company.title}.`,
    });
  })
  .catch(error => {
    res.send(error);
  })
}

export async function inviteMultipleUsers(req, res){
  console.log(req.body);
  res.send({
    response: req.body
  });
}
