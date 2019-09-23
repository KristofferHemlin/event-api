import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import {getRepository, getConnection} from "typeorm";
import {Request, Response} from 'express';

import * as excelToJson from 'convert-excel-to-json';

import * as multer from 'multer';

// Multer file upload handling.
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' +file.originalname )
    }
})

var upload = multer({
  storage: storage,
}).single('image')


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
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      res.send(err)
    } else if (err) {
      res.send(err)
    }

    const result = excelToJson({
      sourceFile: req.file.path
    });

    res.status(200).send(result)
  })
}

export async function getUserEventActivities(req: Request , res: Response) {
  getConnection()
    .createQueryBuilder("Activity", "activity")
    .innerJoin("activity.participants", "ap", "ap.id=:userId", {userId: req.params.userId})
    .where("activity.event=:eventId", {eventId: req.params.eventId})
    .getMany()
    .then(
      result => {
        res.status(200).send(result);
      }, 
      error => {
        res.status(500).send();
        console.log("An error occurred when processing the query: "+error);
      });
}