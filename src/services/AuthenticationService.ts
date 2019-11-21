import * as bCrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import UserModel from "../models/UserModel";
import GeneralModel from "../models/GeneralModel";
import ResourceNotFoundError from "../types/errors/ResourceNotFoundError";
import RequestNotValidError from '../types/errors/RequestNotValidError';
import { deselectFields } from '../modules/helpers';
import ServerError from '../types/errors/ServerError';
import ForbiddenAccessError from '../types/errors/ForbiddenAccessError';
import AccessTokenError from '../types/errors/AccessTokenError';
import {COMPANY_MANAGER} from '../types/RoleType';
import {sendMail, resetPasswordTemplate} from '../modules/email';
import {validatePassword} from '../modules/validation';
import InputNotValidError from '../types/errors/InputNotValidError';

export default class AuthenticationService {
    private userNonReturnableFields = ["isActive", "password", "resetPwdToken", "resetPwdExpireAt", "refreshToken"];
    private userModel = new UserModel();
    private generalModel = new GeneralModel();

    async validateAccessToken(token) {
        const bearerToken =  token; // Bearer {token}
        if (!bearerToken){
            throw new RequestNotValidError("No access token provided");
        }
        const [_, accessToken] = bearerToken.split(" "); 
        jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
          if (err){
            throw new AccessTokenError("Access token not valid");
          } else {
            return Promise.resolve();
          }
        })
    }

    async authenticateUser(email: string, password: string) {
        const theUser = await this.userModel.getUserByEmail(email, ["password"], ["company", "role"]).catch(() => {
           throw new ServerError("Error while trying to authenticate user");
       })
      
        // If no user could be found.
        if(!theUser){
          throw new ResourceNotFoundError("No user with the provided email");
        }
      
        const passwordMatch = await bCrypt.compare(password, theUser.password).catch(error => {
            console.error("Error while authenticating user:", error);
            throw new ResourceNotFoundError("Error while authenticating user")
        })

          // If the password is wrong.
        if (!passwordMatch) {
            throw new RequestNotValidError("The wrong password was provided")
        } else {

        const [accessToken, newRefreshToken] = this.generateTokens(theUser);
        const refreshTokenHash = crypto.createHmac('sha256', process.env.REFRESH_SECRET).update(newRefreshToken).digest('hex');
        theUser.refreshToken = refreshTokenHash;

        return this.userModel.saveUser(theUser).then(user => {
            const cleanUser = deselectFields(user, this.userNonReturnableFields);
            return {message: 'Authentication successfull! Enjoy your stay!',
                    accessToken: accessToken,
                    refreshToken: newRefreshToken,
                    user: cleanUser,
                }
        }).catch(() => {
            throw new ServerError("Error when autenticating user")
        })    
        }
    }

    async refreshToken(userId: number, refreshToken: string) {
      
        if (!refreshToken) {
          throw new RequestNotValidError("No refresh token provided")
        }
        if (!userId) {
            throw new RequestNotValidError("No user id provided")
        }        
        
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
            if (err) {
                throw new ForbiddenAccessError("Refresh token not valid");
            } else {
                return decoded;
            }
        });

        if (parseInt(decoded.userId) !== userId) {
            throw new ForbiddenAccessError("Refresh token not valid", "User id does not match");
        }
        const refreshTokenHash = crypto.createHmac('sha256', process.env.REFRESH_SECRET).update(refreshToken).digest('hex');
        
        const user = await this.userModel.getUserById(userId, ["refreshToken"], ["company", "role"]).catch(() => {
            throw new ServerError("Error while refreshing token.")
        })

        if (user.refreshToken !== refreshTokenHash) {
            throw new ForbiddenAccessError("Refresh token not valid", "No user has the provided token")
          }
        let accessToken, newRefreshToken
        try {
            [accessToken, newRefreshToken] = this.generateTokens(user);
        } catch (error) {
            throw new ServerError("Could not refresh token")
        }
        const newRefreshTokenHash = crypto.createHmac('sha256', process.env.REFRESH_SECRET).update(newRefreshToken).digest('hex');
        user.refreshToken = newRefreshTokenHash;
        
        return this.userModel.saveUser(user).then(() => {
            return {
            accessToken: accessToken,
            refreshToken: newRefreshToken
            }
        }).catch(() => {
            throw new ServerError("Error while refreshing token");
        })
    }

    async sendResetPasswordEmail(email: string) {
        
        if (!email) {
            throw new RequestNotValidError("No email provided.");
        }
        
        const user = await this.userModel.getUserByEmail(email).catch(error => {
            throw new ServerError("Could not send email");
        })

        if (!user) {
            throw new ResourceNotFoundError("Email not registered");
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expireDate = new Date(Date.now() + 3600000);  //Expires in 1h 3600000
        var tokenHash = crypto.createHmac('sha256', process.env.RESET_SECRET).update(token).digest('hex');

        user.resetPwdToken = tokenHash;
        user.resetPwdExpireAt = expireDate;

        const updatedUser = await this.userModel.saveUser(user).catch(() => {
            throw new ServerError("Error while processing request");
        })
        const url = process.env.API_URL+"/deeplink/"+token;
        const message = resetPasswordTemplate(updatedUser, url);
        return sendMail(message).then(_ => {
            return {message: "Email sent"};
        }).catch(error => {
            console.error("Error while trying to send email: "+ error);
            throw new ServerError("Could not send mail");
        });
    }

    async resetPassword(token: string, newPassword: string) {
        const tokenHash = crypto.createHmac('sha256', process.env.RESET_SECRET).update(token).digest('hex');
        const user = await this.userModel.getUserByToken(tokenHash, ["resetPwdExpireAt"]).catch(() => {
            throw new ServerError("Could not update password");
        });
        if (!user) {
            throw new RequestNotValidError("Link not valid");
        }

        const currentTime = new Date(Date.now());
        if (user.resetPwdExpireAt < currentTime) {
            user.resetPwdExpireAt = null;
            user.resetPwdToken = null;
            this.userModel.saveUser(user).catch(() => {})
            throw new RequestNotValidError("Link expired. Please request a new link.")
        }

        if (!newPassword) {
            throw new RequestNotValidError("No new password provided");
        }
        const [isValid, errorMessage] = validatePassword(newPassword, "password");

        if (!isValid) {
            throw new InputNotValidError(errorMessage);
        }

        let pwdHash;
        try {
            pwdHash = bCrypt.hashSync(newPassword, parseInt(process.env.SALT_ROUNDS, 10));
        } catch (error) {
            throw new ServerError("Could not update password");
        }
        user.password = pwdHash;
        user.resetPwdExpireAt = null;
        user.resetPwdToken = null;
        return this.userModel.saveUser(user).then(() => {
            return {message: "Password updated"}
        }).catch(() => {
            throw new ServerError("Could not update password");
        })        
      }

    async signUpNewUser(userData, companyTitle: string) {
        // TODO: Need more checks when company is created, so no duplicate companies. 
            // More logical to create company and assign a new user as company manager?
            // Need verification and better error handling
        // create a company.
        // add a role.
        // create a user.
        // assign company to user.
        // save user.
        
        const role = await this.generalModel.getRoleFromName(COMPANY_MANAGER).catch(() => {
            throw new ServerError("Could not sign up new user");
        });
        const company = new Company();
        company.title = companyTitle;
      
        const user = new User();
        user.firstName = userData.firstName || null;
        user.lastName = userData.lastName || null;
        user.email = userData.email.toLowerCase() || null;
        user.phone = userData.phone || null;
        user.password = bCrypt.hashSync(userData.password, parseInt(process.env.SALT_ROUNDS, 10));
        user.signupComplete = false;
        user.isActive = true;
        user.company = company;
        user.role = role;
        return this.userModel.saveUser(user).then(user => {
            return user;
        }).catch(error => {
            throw new ServerError("Could not sign up new user");
        })
    }

    async changeUserPassword(userId, currentPwd, newPwd) {      
        if (!userId) {
            throw new ServerError("Could not process the request", "No userId provided");
        }
        if (!currentPwd) {
            throw new RequestNotValidError("Current password not specified");
        }

        let [isValid, errorMessage] = validatePassword(newPwd, "newPassword", currentPwd);
    
        if (!isValid) {
        throw new InputNotValidError(errorMessage);
        }
        
        const user = await this.userModel.getUserById(userId, ["password"]).catch(error => {
            throw new ServerError("Could not change user password");
        })
        if (!user) {
            throw new ResourceNotFoundError("The user account does not exist");
        }
    
        const isMatch = await bCrypt.compare(currentPwd, user.password).catch(error => {
            console.error("Error while comparing passwords:", error);
            throw new ServerError("Could not change user password");
        })
        if (!isMatch) {
            throw new RequestNotValidError("The current password is wrong");
        }
        user.password = bCrypt.hashSync(newPwd, parseInt(process.env.SALT_ROUNDS, 10));

        return this.userModel.saveUser(user).then(() => {
            return {message: "Password changed"};
        }).catch(() => {
            throw new ServerError("The password could not be changed");
        })
      }
    
    // Helper functions to generate tokens
    private generateTokens(user: User){
    if (!user.company || !user.role) {
        throw new Error("The user must contain company and role")
    }
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


}