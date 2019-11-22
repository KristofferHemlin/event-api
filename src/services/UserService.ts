import * as bCrypt from 'bcrypt';

import UserModel from "../models/UserModel";
import User from "../entities/user.entity";
import ServerError from "../types/errors/ServerError";
import { cleanInput, updateEntityFields, deselectFields, getDataUrl, removeImages } from "../modules/helpers";
import { validateUser, validatePassword } from "../modules/validation";
import { ImageType } from "../types/ImageType";
import InputNotValidError from "../types/errors/InputNotValidError";
import CompanyModel from "../models/CompanyModel";
import ResourceNotFoundError from "../types/errors/ResourceNotFoundError";
import GeneralModel from '../models/GeneralModel';
import RequestNotValidError from '../types/errors/RequestNotValidError';

export default class UserService {
    private userModel: UserModel;
    private companyModel: CompanyModel;
    private generalModel: GeneralModel;
    private possibleFields: string[];
    private userNonReturnableFields: string[];

    constructor() {
        this.userModel = new UserModel();
        this.companyModel = new CompanyModel();
        this.generalModel = new GeneralModel();
        this.possibleFields = ["firstName", "lastName", "email", "phone", "companyDepartment", "aboutMe", "allergiesOrPreferences"]
        this.userNonReturnableFields = ["isActive", "password", "resetPwdToken", "resetPwdExpireAt", "refreshToken"];
    }

    async getAllUsers() {
        return this.userModel.getAllUsers(["company", "role"]).catch(() => {
            throw new ServerError("Could not fetch users");
        });
    }

    async getUserById(userId: number) {
        return this.userModel.getUserById(userId, [], ["company", "role", "events", "activities"]).then(user => {
            user.profileImageUrl = getDataUrl(user.profileImageUrl, ImageType.COMPRESSED)
            return user;
        }).catch(() => { throw new ServerError("Could not fetch user")});
    }

    async getUserEventActivities(userId: number, eventId: number) {
        return this.userModel.getUserEventActivities(userId, eventId).catch(() => {
            throw new ServerError("Could not fetch event activities");
        })
    }

    // Temporary function suited for the limited app scope
    async getCurrentEvent(userId: number) {
        return this.userModel.getUserEvents(userId).then(events => {
            if (events.length > 0) {
                let currentEvent = events[0];
                currentEvent.coverImageUrl = getDataUrl(currentEvent.coverImageUrl, ImageType.COMPRESSED);
                return currentEvent;
            } else {
                return {}
            }
        }).catch(() => {
            throw new ServerError("Could not fetch current event for user.");
        })
    }

    async getActivityNotifications(userId: number, limit: number) {
        return this.userModel.getActivityUpdateLogs(userId, limit).catch(() => {
            throw new ServerError("Could not fetch notifications");
        })
    }

    async createUser(companyId: number, userData) {
        const password = userData.password;
        const input = cleanInput(userData);
        const [pwdValid, errorMessagePwd] = validatePassword(password, "password");
        const [inputValid, errorMessageUser, errorDetailsUser] = validateUser(input);

        if (!inputValid || !pwdValid) {
            const errorDetails = errorDetailsUser;
            errorDetails["password"] = errorMessagePwd?errorMessagePwd: undefined;
            throw new InputNotValidError(errorMessagePwd+"\n"+errorMessageUser, errorDetails);
        }

        const company = await this.companyModel.getCompanyById(companyId);
        const role = await this.generalModel.getRoleFromName("COMPANY_MEMBER");

        if (!company) {
            throw new ResourceNotFoundError("The company does not exist");
        }

        const user: User = updateEntityFields(new User(), input, this.possibleFields);
        user.isActive = true;
        user.signupComplete = true;
        user.company = company;
        user.role = role;
        user.password = bCrypt.hashSync(input.password, parseInt(process.env.SALT_ROUNDS, 10));

        return this.userModel.saveUser(user).catch(() => {
            throw new ServerError("Could not update user");
        })
    }

    async addPlayerId(userId: number, playerId: string) {        
        if (!playerId) {
            throw new RequestNotValidError("No playerId specified");
        }
        const user = await this.userModel.getUserById(userId).catch(() => {
            throw new ServerError("Could not add playerId");
        });
        if (!user) {
            throw new ResourceNotFoundError("The user does not exist");
        }    
        return this.userModel.addPlayerId(playerId, user).catch(error => {
            throw new ServerError("Could not add playerId");
        })
    }

    async logoutUser(userId: number) {
        // Removes refresh token, unsubscribes to onesignal in app.
        const user = await this.userModel.getUserById(userId);
        if (!user) {
            throw new ResourceNotFoundError("The user does not exits");
        }
        user.refreshToken = null; // Now all devices will be logged out..
        return this.userModel.saveUser(user).catch(() => {
            throw new ServerError("Could not logout user")
        })
    };

    async firstUpdate(userId: number, userData, profileImagePath: string) {
        const user = await this.userModel.getUserById(userId).catch(() => {
            throw new ServerError("Could not update user", "Error while fetching user");
        });
        if (!user) {
            throw new ResourceNotFoundError("The user does not exist");
        }
        if (user.signupComplete) {
            removeImages(profileImagePath);
            throw new RequestNotValidError("The user has already signed up");
        }

        const newPwd = userData.password;
        const input = cleanInput(userData);

        const [pwdValid, errorMessagePwd] = validatePassword(newPwd, "password");
        const [inputValid, errorMessageUser, errorDetailsUser] = validateUser(input);

        
        if (!inputValid || !pwdValid) {
            const errorDetails = errorDetailsUser;
            errorDetails["password"] = errorMessagePwd?errorMessagePwd: undefined;
            removeImages(profileImagePath);
            throw new InputNotValidError(errorMessagePwd+"\n"+errorMessageUser, errorDetails);
        }

        const updatedUser = updateEntityFields(user, input, this.possibleFields);
        updatedUser.signupComplete = true;
        updatedUser.password = bCrypt.hashSync(input.password, parseInt(process.env.SALT_ROUNDS, 10));
        updatedUser.profileImageUrl = profileImagePath;
        
        return await this.userModel.saveUser(updatedUser).then(user => {
            return deselectFields(user, this.userNonReturnableFields);
        }).catch(() => {
            removeImages(profileImagePath);
            throw new ServerError("Could not save user");
        });        
    };

    async updateUser(userId, userData, profileImagePath) {
        let userToUpdate = await this.userModel.getUserById(userId).catch(() => {
            throw new ServerError("Could not update user", "Error while saving user");
        });
      
        if (!userToUpdate) {
            removeImages(profileImagePath);
            throw new ResourceNotFoundError("The user does not exist");
        }
      
        let input = cleanInput(userData);
        const [inputValid, errorMessage, errorDetails] = validateUser(input);
    
        if (!inputValid) {
            removeImages(profileImagePath);
            throw new InputNotValidError(errorMessage, errorDetails);
        }
        
        const updatedUser = updateEntityFields(userToUpdate, input, this.possibleFields);
        
        let oldFilePath: string;  // Save the old image path so it can be deleted if the update is successfull
        if (profileImagePath){
            oldFilePath = userToUpdate.profileImageUrl;
            updatedUser.profileImageUrl = profileImagePath;
        } else {
            oldFilePath = null
        }
        return this.userModel.saveUser(updatedUser).then( user => {
            if (profileImagePath) {
                removeImages(oldFilePath);
            }
            return deselectFields(user, this.userNonReturnableFields);
        }).catch(() => {
            removeImages(profileImagePath);
            throw new ServerError("Could not update user", "Error while saving user")
        })
    }

    async deleteUser(userId: number) {
        return this.userModel.deleteUser(userId).then(user => {
            if (user) {
                removeImages(user.profileImageUrl);
            }
            return;
        }).catch(() => {
            throw new ServerError("Could not remove user");
        })
      }

    async deleteProfileImage(userId: number) {    
        const user = await this.userModel.getUserById(userId).catch(() => {
            throw new ServerError("Could not delete profile image", "Error while fetching user");
        })    
        if (!user) {
            throw new ResourceNotFoundError("The user does not exist");
        }
        
        if (user.profileImageUrl){
            const imagePath = user.profileImageUrl;
            user.profileImageUrl = null;
            return this.userModel.saveUser(user).then(() => {
                removeImages(imagePath);
                return;
                }).catch(error => {
                throw new ServerError("Could not remove profile image", "Error while saving user");
            })
        }
        return; 
    } 
      
      
}