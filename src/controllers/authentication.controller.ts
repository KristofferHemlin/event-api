import * as bCrypt from 'bcrypt';
import {getRepository, createQueryBuilder, JoinTable} from "typeorm";
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Role from '../entities/role.entity';

import * as mail from '../modules/email';
import { validatePassword } from '../modules/validation';

export async function authenticateUser(req, res) {

  const theUser = await getRepository(User)
    .createQueryBuilder()
    .addSelect('User.password')
    .leftJoinAndSelect("User.company", "company")
    .leftJoinAndSelect("User.role", "role")
    .where("User.email = :email", { email: req.body.email })
    .getOne();

  // If no user could be found.
  if(!theUser){
    return res.status(404).send({
      message: 'There exists no user for the provided email.',
    })
  }

  bCrypt.compare(req.body.password, theUser.password).then(resp => {
    // If the password is wrong.
    if (!resp) {
      return res.status(400).send({
        message: 'The wrong password was provided.',
      })  
    } else {
      
      const [accessToken, newRefreshToken] = generateTokens(theUser);
      const refreshTokenHash = crypto.createHmac('sha256', process.env.REFRESH_SECRET).update(newRefreshToken).digest('hex');
      theUser.refreshToken = refreshTokenHash;

      getRepository(User).save(theUser).then(user => {
        const {password, refreshToken, resetPwdToken, resetPwdExpireAt, ...theUser} = user;
        return res.json({
          message: 'Authentication successfull! Enjoy your stay!',
          accessToken: accessToken,
          refreshToken: newRefreshToken,
          user: theUser,
        });
      }).catch(error => {
        console.error("Error while updating user token:", error);
        return res.status(500).send({
          type: error.name,
          message: "Error while trying to authenticate user"})
      })
    }
  }).catch(error => {
    console.error("Error while authenticating user:", error);
    return res.status(500).send({
      type: error.name,
      message: "Error while trying to authenticate user."});
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.body.refreshToken;
  const userId = req.body.userId;

  if (!refreshToken) {
    res.status(400).send({message: "No refresh token provided."})
    return
  }

  if (!userId) {
    res.status(400).send({message: "No userId provided."})
    return
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).send({message: "Refresh token not valid. Expired."})
      return
    } else {
      if (parseInt(decoded.userId) !== parseInt(userId)) {
        res.status(403).send({message: "Refresh token not valid. UserId does not match."})
        return
      }
      const refreshTokenHash = crypto.createHmac('sha256', process.env.REFRESH_SECRET).update(refreshToken).digest('hex');

      createQueryBuilder(User)
      .addSelect("User.refreshToken")
      .innerJoinAndSelect("User.company", "company")
      .innerJoinAndSelect("User.role", "role")
      .where("User.id=:id and User.refreshToken=:refreshTokenHash", {id: userId, refreshTokenHash: refreshTokenHash})
      .getOne()
      .then(user => {
        if (!user) {
          res.status(403).send({message: "Refresh token not valid. No user has the provided token."})
          return
        }
        const [accessToken, newRefreshToken] = generateTokens(user);
        
        const newRefreshTokenHash = crypto.createHmac('sha256', process.env.REFRESH_SECRET).update(newRefreshToken).digest('hex');
        user.refreshToken = newRefreshTokenHash;
        
        getRepository(User).save(user).then( user => {
          res.status(200).send({
            accessToken: accessToken,
            refreshToken: newRefreshToken
          })
          return
        })  
      })
      .catch(error => {
        console.error("Error while fetching user:", error);
        res.status(500).send("Error while verifying request.");
      })
    }
  })
}

// Helper functions to generate tokens

function generateTokens(user: User){
  // The user need to contain role and company
  let payload = {
    userId: user.id,
    company_id: user.company.id,
    role: user.role
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRETIME_AT,
  });

  const refreshToken = jwt.sign({userId: user.id}, process.env.REFRESH_SECRET, {
    expiresIn: process.env.EXPIRETIME_RT,
  });

  return [accessToken, refreshToken]
}

export function validateAccessToken(req, res) {
  const bearerToken =  req.headers.authorization; // Bearer {token}
  if (bearerToken){
    const [_, accessToken] = bearerToken.split(" "); 
  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err){
      return res.status(401).send({message: "Access token not valid"});
    } else {
      return res.status(204).send();
    }
  })
} else {
  return res.status(400).send({message: "No access token provided."})
}
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
    return res.status(200).send(response);
  })
  .catch(error => {
    console.error("Error while creating user:", error);
    return res.status(500).send({message: "Could not create new user"});
  })
}

export async function changeUserPassword(req, res) {
  let currentPwd = req.body.currentPassword;
  const newPwd = req.body.newPassword;
  
  let [isValid, errorMessage] = validatePassword(newPwd, "newPassword", currentPwd);

  if (!isValid) {
    return res.status(400).send({
      message: "The new password is not valid",
      details: errorMessage})
  }

  const user = await createQueryBuilder(User)
    .addSelect("User.password")
    .where("User.id=:userId", {userId: req.decoded.userId})
    .getOne();

  if (!user) {
    return res.status(404).send({message: "The user account does not exist"});
  }

  bCrypt.compare(currentPwd, user.password)
    .then( isMatch => {
      if (!isMatch) {
        return res.status(400).send({message: "The current password is wrong"});
      }
      user.password = bCrypt.hashSync(newPwd, parseInt(process.env.SALT_ROUNDS, 10));
      getRepository(User).save(user)
      .then(_ => {return res.status(200).send({message: "Password changed"})})
      .catch(error => {
        console.error("Error while updating password:", error);
        return res.status(500).send({message: "The password could not be changed"})});
    }, 
  _ => res.status(400).send({message: "Cannot change password without current password"}))
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
        var tokenHash = crypto.createHmac('sha256', process.env.RESET_SECRET).update(token).digest('hex');

        user.resetPwdToken = tokenHash;
        user.resetPwdExpireAt = expireDate;

        getRepository(User).save(user).then( usr => {
          const url = process.env.API_URL+"/deeplink/"+token;
          const emailTemplate = mail.resetPasswordTemplate(user, url);
          
          mail.transporter.sendMail(emailTemplate, (err, info) => {
            if (err) {
              console.error("Error while trying to send email: "+err);
              return res.status(500).send({message: "Error while sending email"})
            }
            return res.status(200).send({message: "Email sent"})
          })
        })
        .catch(error => {
          console.error("Error while updating user: ", error)
          return res.status(500).send({message: "Error while processing the request."})
        })
      } else {
          return res.status(400).send({message: "Email not registered"});
      }
  }, error => {return res.status(500).send({message: "Error while verifying user email"})})
  .catch(error => {
    console.error("Error while sending email: ", error);
    return res.status(500).send({message: "Could not process the request. Email not sent."});
});
}

export async function redirectDeepLink(req, res) {
  const token = req.params.token
  res.redirect('evently://resetpassword/'+token); //TODO: CHANGE TO CORRECT APP NAME
  return;
}

export async function resetPassword(req, res) {
  const token = req.params.token;
  const tokenHash = crypto.createHmac('sha256', process.env.RESET_SECRET).update(token).digest('hex');

  createQueryBuilder(User)
    .addSelect("User.resetPwdExpireAt")
    .where("User.resetPwdToken=:tokenHash", {tokenHash: tokenHash})  
    .getOne()
    .then(user => {
      const currentTime = new Date(Date.now());
      if (!user) {
        return res.status(400).send({message: "Authentication token not valid"});
      } else if (user.resetPwdExpireAt < currentTime) {
        user.resetPwdExpireAt = null;
        user.resetPwdToken = null;
        getRepository(User).save(user).then(
          () => {}, error => console.error("Error while updating user: ", error))
        return res.status(400).send({message: "Authentication token not valid"}) 
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
            _ => {return res.status(200).send({message: "Password updated"})},
            error => {return res.status(500).send({message: "Could not update password"})})
        })
      }
    }, error => {
      console.error("Error when trying to fetch user: "+error)
      return res.status(500).send({message: "Could not fetch user"})})
    .catch(error => {
      console.error("Error while trying to update password"+error);
      return res.status(500).send({message: "Could not process request"});
    })
}


