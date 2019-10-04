import * as bCrypt from 'bcrypt';
import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import Event from '../entities/event.entity';
import {getRepository, getConnection, createQueryBuilder} from "typeorm";
import {Request, Response} from 'express';
import * as fs from 'fs';

import * as excelToJson from 'convert-excel-to-json';

import * as multer from 'multer';

// Multer file upload handling.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' +file.originalname )
  }
})

const accepted_extensions = ['jpg', 'jpeg', 'png', '.heic'];

var upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    file: 1,
  },
  fileFilter: (req, file, cb) => {
    console.log('checking the file');
    // if the file extension is in our accepted list
    if (accepted_extensions.some(ext => file.originalname.endsWith("." + ext))) {
      return cb(null, true);
    }

    // otherwise, return error
    return cb({message: 'Only ' + accepted_extensions.join(", ") + ' files are allowed!'})
  }  
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
 await getRepository(User).find({relations: ['company', 'events', 'activities', 'role'], order: {id: 'ASC'}})
 .then(response => {
  res.send(response);
 })
 .catch(error => {
  res.send(error);
 })
}

export async function getUserInfoForCurrentUser(req, res) {
  await getRepository(User).findOne({ id: req.decoded.user_id }, {relations: ['company', 'activities', 'events']})
  .then(user => {
    return res.send(user);
  })
  .catch(error => {
    return res.send(error);
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

  userToUpdate.firstName = req.body.firstName? req.body.firstName: userToUpdate.firstName;
  userToUpdate.lastName = req.body.lastName? req.body.lastName: userToUpdate.lastName;
  userToUpdate.phone = req.body.phone? req.body.phone: userToUpdate.phone;
  userToUpdate.email = req.body.email? req.body.email: userToUpdate.email;
  userToUpdate.companyDepartment = req.body.companyDepartment;
  userToUpdate.aboutMe = req.body.aboutMe;
  userToUpdate.allergiesOrPreferences = req.body.allergiesOrPreferences;

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

export async function getUserEventActivities(req: Request , res: Response) {
  getConnection()
    .createQueryBuilder("Activity", "activity")
    .innerJoin("activity.participants", "ap", "ap.id=:userId", {userId: req.params.userId})
    .where("activity.event=:eventId", {eventId: req.params.eventId})
    .orderBy("activity.id", "ASC")
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

export async function getCurrentEvent(req, res){
  createQueryBuilder(Event)
  .innerJoin("Event.participants", "ep")
  .where("ep.id=:userId", {userId: req.params.userId})
  .getMany()
  .then(
    response => res.status(200).send(response[0]), 
    error => {
      console.log(error)
      res.status(400).send({message: "Could not fetch events"})});
}

// Helper function for removing an image. 
const removeFile = (path) => {
  if(path){
    fs.unlinkSync('./' + path);
  }
}; 

export async function firstUpdate(req, res){
  const userId = req.params.userId;

  // Starts the upload of the user profile image.
  upload(req, res, (err) => {

    // Check for any faults with the image upload.
    if(err){
      return res.status(500).send(err);
    }

    if(!req.file){
      return res.status(400).send({ message: 'Missing profile image.'});
    }

    getRepository(User).findOne({ id: userId })
      .then(user => {
        if (user.signupComplete) {
          removeFile(req.file.path)
          return res.status(403).send({ message: "The user has already signed up" });
        }
        const newPwd = req.body.password;

        if (!newPwd) {
          removeFile(req.file.path)
          return res.status(400).send({ message: "Need to specify a new password" });
        }
        user.profileImageUrl = req.file.filename;
        user.firstName = req.body.firstName ? req.body.firstName : user.firstName;
        user.lastName = req.body.lastName ? req.body.lastName : user.lastName;
        user.email = req.body.email ? req.body.email : user.email;
        user.phone = req.body.phone ? req.body.phone : user.phone;
        user.companyDepartment = req.body.companyDepartment ? req.body.companyDepartment : user.companyDepartment;
        user.signupComplete = true;
        user.password = bCrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS, 10));
        getRepository(User).save(user).then(response => {
          response.password = undefined;
          res.status(200).send(response);
        });
      })
      .catch(error => {
        removeFile(req.file.path)
        if (error.response){
          return res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
          return res.send(error.request);
        } else {
          return res.send(error.message);
        }
      })
    })
  };