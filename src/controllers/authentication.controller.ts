import * as bCrypt from 'bcrypt';
import {getRepository} from "typeorm";
import * as jwt from 'jsonwebtoken';
import jwtConfig from '../../jwtConfig';
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

  let token = jwt.sign(payload, jwtConfig.secret, {
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
  account.password = bCrypt.hashSync(req.body.password, 16);
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
