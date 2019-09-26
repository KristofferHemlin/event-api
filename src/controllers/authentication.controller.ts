import * as bCrypt from 'bcrypt';
import {getRepository, createQueryBuilder} from "typeorm";
import * as jwt from 'jsonwebtoken';
// import * as authHelpers from '../helpers/authentication';

import Company from '../entities/company.entity';
import Account from '../entities/account.entity';
import User from '../entities/user.entity';
import Role from '../entities/role.entity';

export async function authenticateUser(req, res) {

  let account = await getRepository(Account).findOne({ email: req.body.email}, {relations: ['user']})

  // If no account could be found.
  if(!account){
    return res.status(500).send({
      message: 'There exists no account for the provided email.',
    })
  }

  // If the password is wrong.
  if(req.body.password === '' || !bCrypt.compareSync(req.body.password, account.password)){
    return res.status(401).send({
      message: 'The wrong password was provided.',
    })
  }

  let user = await getRepository(User).findOne({ id: account.user.id }, {relations: ['company']});

  // If valid credentials were provided,
  let payload = {
    user_id: account.user.id,
    company_id: user.company.id,
    role: 'ADMIN'
  }

  console.log(payload);

  let token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  res.json({
    message: 'Authentication successfull! Enjoy your stay!',
    token: token,
  });

}

export async function signUpNewUser(req, res) {

  // create a company.
  // create an account.
  // add a role.
  // create a user.
  // assign account into user.
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
  user.isActive = true;
  user.company = company;
  user.role = role;

  const account = new Account();
  account.email = req.body.email.toLowerCase();
  account.password = bCrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS, 10));
  account.user = user;

  getRepository(Account).save(account)
  .then(response => {
    res.send(response);
  })
  .catch(error => {
    console.log(error);
    res.send(error);
  })
}

export async function changeUserPassword(req, res) {

  let account = await createQueryBuilder(Account)
  .innerJoin("Account.user", "au")
  .where("au.id=:userId", {userId: req.decoded.user_id})
  .getOne();

  if (account) {
    // Verify current password
    let currentPwd = req.body.currentPassword;
    bCrypt.compare(currentPwd, account.password)
      .then( isMatch => {
        if (isMatch) {
          // Verify the new password is different from current
          let newPwd = req.body.newPassword;
          if (newPwd && (newPwd !== currentPwd)) {
            // The new password is added to the account
            account.password = bCrypt.hashSync(newPwd, parseInt(process.env.SALT_ROUNDS, 10));
            getRepository(Account).save(account)
            .then(_ => res.status(200).send({message: "Password changed"}))
            .catch(_ => res.status(500).send({message: "The password could not be changed"}));
          } else {
            res.status(400).send({message: "The new password is not valid"})
            }
        } else {
          res.status(400).send({message: "The current password is wrong"})
          }
      }, _ => res.status(400).send({message: "Cannot change password without current password"}));
  } else {
    res.status(400).send({message: "The user account does not exist"})
  }
}
