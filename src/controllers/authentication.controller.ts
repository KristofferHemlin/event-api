import * as bCrypt from 'bcrypt';
import {getRepository} from "typeorm";
import * as jwt from 'jsonwebtoken';
// import * as authHelpers from '../helpers/authentication';

import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Role from '../entities/role.entity';

export async function authenticateUser(req, res) {

  let theUser = await getRepository(User)
    .createQueryBuilder()
    .addSelect('password')
    .where("user.email = :email", { email: req.body.email })
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

  console.log(payload);

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
