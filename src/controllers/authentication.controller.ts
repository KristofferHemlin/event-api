import * as bCrypt from 'bcrypt';
import {getRepository, createQueryBuilder, JoinTable} from "typeorm";
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Role from '../entities/role.entity';

import * as mail from '../modules/email';

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
    return res.status(401).send({
      message: 'There exists no user for the provided email.',
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
    res.status(200).send(response);
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({message: "Could not create new user"});
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

export async function sendResetPasswordEmail(req, res) {
  const email = req.body.email;
  
  if (!email) {
    return res.status(400).send({message: "No email provided"})
  }

  createQueryBuilder(User)
    .where("email=:userEmail", {userEmail: email})  
    .getOne()
    .then(user => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const expireDate = new Date(Date.now() + 3600000);  //Expires in 1h
        var tokenHash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(token).digest('hex');

        user.resetPwdToken = tokenHash;
        user.resetPwdExpireAt = expireDate;

        getRepository(User).save(user).then( usr => {
          const url = "https://eventapp-master-api.azurewebsites.net/deeplink/"+token;
          const emailTemplate = mail.resetPasswordTemplate(user, url);
          
          mail.transporter.sendMail(emailTemplate, (err, info) => {
            if (err) {
              console.log("Error while trying to send email: "+err);
              return res.status(500).send({message: "Error while sending email"})
            }
            res.status(200).send({message: "Email sent"})
          })
        })
        .catch(error => {
          console.log("Error while updating user: ", error)
          return res.status(500).send({message: "Error while processing the request."})
        })
      } else {
          res.status(400).send({message: "Email not registered"});
      }
  }, error => {return res.status(500).send({message: "Error while verifying user email"})})
  .catch(error => {
    console.log("Error while sending email: ", error);
    return res.status(500).send({message: "Could not process the request. Email not sent."});
});
}

export async function redirectDeepLink(req, res) {
  const token = req.params.token
  res.redirect('evently://resetpassword/'+token);
}

export async function resetPassword(req, res) {
  const token = req.params.token;
  const tokenHash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(token).digest('hex');

  createQueryBuilder(User)
    .addSelect("User.resetPwdExpireAt")
    .where("User.resetPwdToken=:tokenHash", {tokenHash: tokenHash})  
    .getOne()
    .then(user => {
      const currentTime = new Date(Date.now());
      if (!user) {
        return res.status(401).send({message: "Authentication token not valid"});
      } else if (user.resetPwdExpireAt < currentTime) {
        user.resetPwdExpireAt = null;
        user.resetPwdToken = null;
        getRepository(User).save(user).then(
          () => {}, error => console.log("Error while updating user: ", error))
        return res.status(401).send({message: "Authentication token not valid"}) 
      } else {
        const newPassword = req.body.password;
        if (!newPassword) {
          return res.status(400).send({message: "No password specified"})
        }
        bCrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS, 10), (error, hash) => {
          if (error) {
            return res.status(500).send({message: "Error while processing the request. Password not updated"});
          }
          user.password = hash;
          user.resetPwdExpireAt = null;
          user.resetPwdToken = null;
          getRepository(User).save(user).then(
            _ => res.status(200).send({message: "Password updated"}),
            error => res.status(500).send({message: "Could not update password"}))
        })
      }
    }, error => {
      console.log("Error when trying to fetch user: "+error)
      res.status(500).send({message: "Could not fetch user"})})
    .catch(error => {
      console.log("Error while trying to update password"+error);
      res.status(500).send({message: "Could not process request"});
    })
}


