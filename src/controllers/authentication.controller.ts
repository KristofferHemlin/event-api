import * as bCrypt from 'bcrypt';
import {getRepository, createQueryBuilder} from "typeorm";
import * as jwt from 'jsonwebtoken';
// import * as authHelpers from '../helpers/authentication';

import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Role from '../entities/role.entity';

export async function authenticateUser(req, res) {

  let theUser = await getRepository(User)
    .createQueryBuilder()
    .addSelect('User.password')
    .leftJoinAndSelect("User.company", "company")
    .leftJoinAndSelect("User.role", "role")
    .where("User.email = :email", { email: req.body.email })
    .getOne();

  // If no user could be found.
  if(!theUser){
    return res.status(500).send({
      message: 'There exists no  for the provided email.',
    })
  }

  // If the password is wrong.
  if(req.body.password === '' || !bCrypt.compareSync(req.body.password, theUser.password)){
    return res.status(401).send({
      message: 'The wrong password was provided.',
    })
  }

  // If valid credentials were provided,
  let payload = {
    user_id: theUser.id,
    company_id: theUser.company.id,
    role: theUser.role
  }

  theUser.password = undefined;

  let token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  res.json({
    message: 'Authentication successfull! Enjoy your stay!',
    token: token,
    user: theUser,
  });

}

export async function signUpNewUser(req, res) {

  // create a company.
  // add a role.
  // create a user.
  // assign company to user.
  // save user.

  const role = await getRepository(Role).findOneOrFail({ role: "COMPANY_MANAGER" });

  const company = new Company();
  company.title = req.body.title;

  const user = new User();
  user.firstName = req.body.firstName || null;
  user.lastName = req.body.lastName || null;
  user.email = req.body.email.toLowerCase() || null;
  user.phone = req.body.phone || null;
  user.password = bCrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS, 10));
  user.signupComplete = false;
  user.isActive = true;
  user.company = company;
  user.role = role;

  getRepository(User).save(user)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    console.log(error);
    res.send(error);
  })
}

export async function changeUserPassword(req, res) {
  createQueryBuilder(User)
    .addSelect("User.password")
    .where("User.id=:userId", {userId: req.decoded.user_id})
    .getOne()
    .then(user => {
      if (!user) {
        return res.status(400).send({message: "The user account does not exist"});
      }
      let currentPwd = req.body.currentPassword;
      bCrypt.compare(currentPwd, user.password)
      .then( isMatch => {
        if (!isMatch) {
          return res.status(400).send({message: "The current password is wrong"});
        }
        const newPwd = req.body.newPassword;
        if (!newPwd || newPwd === currentPwd) {
          return res.status(400).send({message: "The new password is not valid"});
        }

        user.password = bCrypt.hashSync(newPwd, parseInt(process.env.SALT_ROUNDS, 10));
        getRepository(User).save(user)
        .then(_ => res.status(200).send({message: "Password changed"}))
        .catch(_ => res.status(500).send({message: "The password could not be changed"}));
      }, _ => res.status(400).send({message: "Cannot change password without current password"}))
    });
}

export async function firstUpdate(req, res){
  // find user
  // check that the user isn't acitve
  // update the user info
  const userId = req.decoded.user_id;
  getRepository(User).findOne({id: userId})
    .then(user => {
      if (user.signupComplete) {
         return res.status(403).send({message: "The user has already signed up"});
      }
      const newPwd = req.body.password;
      
      if (!newPwd) {
        return res.status(400).send({message: "Need to specify a new password"});
      }
      user.firstName = req.body.firstName? req.body.firstName : user.firstName;
      user.lastName = req.body.lastName? req.body.lastName : user.lastName;
      user.email = req.body.email? req.body.email : user.email;
      user.phone = req.body.phone? req.body.phone : user.phone;
      user.signupComplete = true;
      user.password = bCrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS, 10));
      getRepository(User).save(user).then(response => {
        response.password = undefined;
        res.status(200).send(response);
      });
    })
}
