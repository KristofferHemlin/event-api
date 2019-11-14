import * as bCrypt from 'bcrypt';
import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import Event from '../entities/event.entity';
import { getRepository, getConnection, createQueryBuilder } from "typeorm";
import { Request, Response } from 'express';
import * as excelToJson from 'convert-excel-to-json';

import ActivityUpdateLog from '../entities/activitylog.entity';
import { validateUser, validatePassword } from '..//modules/validation';
import PlayerId from '../entities/playerId.entity';
import { 
  getStorage, 
  uploadFile, 
  removeFile, 
  getDataUrl,
  removeAllFiles, 
  ImageType, 
  handleMulterError,
  compressAndResize} from '../modules/fileHelpers';
import {cleanInput, updateEntityFields} from '../modules/helpers';

// Get storage for multer
const storage = getStorage("public/original", "profileImage")

const possibleInputFields = ["firstName", "lastName", "email", "phone", "companyDepartment", "aboutMe", "allergiesOrPreferences"]

export async function createUser(req, res) {

  const input = cleanInput(req.body);

  const [inputValid, errorMessage, errorDetails] = validateUser(req.body);

  if (!inputValid) {
    res.status(400).send({
      message: errorMessage,
      details: errorDetails})
    return;
  }

  const user = updateEntityFields(new User(), input, possibleInputFields);
  user.isActive = false;  // Not sure why this is false.. More logical if it is true.

  await getRepository(User).save(user)
    .then(response => {
      return res.status(200).send(response);
    })
    .catch(error => {
      console.error("Error while creating new user:", error);
      return res.status(500).send({
        type: error.name,
        message: "Could not create new user"
      });
    })
}

export async function getAllUsers(req, res) {
  await getRepository(User).find({ relations: ['company', 'events', 'activities', 'role'], order: { id: 'ASC' } })
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {
      console.error("Error while fetching all users:", error)
      res.status(500).send({ message: "Could not fetch all users" });
    })
}

export async function getUserInfoForCurrentUser(req, res) {
  await getRepository(User).findOne({ id: req.decoded.user_id }, { relations: ['company', 'activities', 'events'] })
    .then(user => {
      if (user) {
        return res.status(200).send(user);
      } else {
        return res.status(404).send({ message: "No user exists for the provided id." });
      }
    })
    .catch(error => {
      console.error("Error while fetching user:", error);
      return res.status(500).send({
        type: error.name,
        message: "Could not fetch user."
      });
    })
}

export async function getUserById(req, res) {
  getRepository(User).findOne({ id: req.params.userId }, { relations: ['company', 'activities', 'events'] })
  .then(user => {
      if (user) {
        user.profileImageUrl = getDataUrl(user.profileImageUrl, ImageType.COMPRESSED);
        return res.status(200).send(user);
      } else {
        return res.status(404).send({ message: "No user exists for the provided id" });
      }
    })
    .catch(error => {
      console.error("Error while fetching user:", error);
      res.status(500).send({
        type: error.name,
        message: "Error while fetching user."
      });
    })
}

export async function updateUser(req, res) {
  let userToUpdate = await getRepository(User).findOne({ id: req.params.userId });

  if (!userToUpdate) {
    return res.status(404).send({ message: "No user exists for the provided id." })
  }
  uploadFile(storage, req, res, async (err) => {
    // Check for any faults with the image upload.

    if (err) {
      console.error("Error while processing form data:", err)
      const errorMessage = handleMulterError(err);
      return res.status(400).send(errorMessage)
    }

    let input = cleanInput(req.body);
    const [inputValid, errorMessage, errorDetails] = validateUser(input);
  
    if (!inputValid) {
      if (req.file) {
        removeFile(req.file.path);
      }
      res.status(400).send({
        message: errorMessage,
        details: errorDetails})
      return;
    }
    
    const updatedUser = updateEntityFields(userToUpdate, input, possibleInputFields);
    
    let oldFilePath: string;  // Save the old image path so it can be deleted if the update is successfull

    if (userToUpdate.profileImageUrl){
      oldFilePath = userToUpdate.profileImageUrl.split(":")[1];
    } else {
      oldFilePath = null
    }

    const {pathToSave, newFilePaths, compressionDone} = await compressAndResize(req.file, 40)
    
    if (req.file) {
      removeFile(req.file.path); // Remove the original file to only save the compressed.
    }
    if (pathToSave) {
      updatedUser.profileImageUrl = pathToSave;
    }

    if (compressionDone) {
      getRepository(User).save(updatedUser)
      .then(response => {
        if (req.file && oldFilePath){  // Only remove old files if there is a new file
          removeAllFiles([oldFilePath, 
            oldFilePath.replace(ImageType.COMPRESSED, ImageType.MINIATURE)]);
        }
        res.status(200).send(response);
        return
        })
        .catch(error => {
          if (req.file) {
            removeAllFiles(newFilePaths);
          }
          console.error("Error while updating user:", error);
          return res.status(500).send({ message: "Could not update user." });
        })
    } else {
      res.status(400).send({message: "Could not upload image."})
      if (req.file){
        removeAllFiles(newFilePaths);
      }
      return;
    }
  })
}

export async function deleteUser(req, res) {
  let user = await getRepository(User).findOne({ id: req.params.userId });
  if (!user) {
    return res.status(400).send({ message: "No user exists for the provided id." })
  }

  await getRepository(User).remove(user)
    .then(response => {
      removeAllFiles([user.profileImageUrl, user.profileImageUrl.replace(ImageType.COMPRESSED, ImageType.MINIATURE)]);
      return res.status(204).send();
    })
    .catch(error => {
      console.error("Error while removing user:", error);
      return res.status(500).send({ message: "Could not delete user." });
    })
}

export async function addCompanyToUser(req, res) {
  let user = await getRepository(User).findOne({ id: req.body.userId });
  let company = await getRepository(Company).findOne({ id: req.body.companyId });

  if (!user) {
    return res.status(404).send({ message: "No user exists for the provided id" })
  }

  if (!company) {
    return res.status(404).send({ message: "No company exists for the provided id" })
  }

  user.company = company;

  await getRepository(User).save(user)
    .then(response => {
      return res.status(200).send({
        message: `User ${user.firstName} ${user.lastName} was successfully added to the company ${company.title}.`,
      });
    })
    .catch(error => {
      console.error("Error while adding user to company:", error);
      return res.status(500).send({
        type: error.name,
        message: "Could not add user to the company."
      });
    })
}

export async function getUserEventActivities(req: Request, res: Response) {
  getConnection()
    .createQueryBuilder("Activity", "activity")
    .innerJoin("activity.participants", "ap", "ap.id=:userId", { userId: req.params.userId })
    .where("activity.event=:eventId", { eventId: req.params.eventId })
    .orderBy("activity.id", "ASC")
    .getMany()
    .then(
      activities => {
        // const activitiesWithImages = activities.map((activity: Activity) => {
        //   activity.coverImageUrl = getDataUrl(activity.coverImageUrl);
        //   return activity;
        // })
        return res.status(200).send(activities);
      },
      error => {
        console.error("An error occurred when processing the query: " + error);
        return res.status(500).send({
          type: error.name,
          message: "Could not fetch user activities"
        });
      });
}

export async function getCurrentEvent(req, res) {
  createQueryBuilder(Event)
    .innerJoin("Event.participants", "ep")
    .where("ep.id=:userId", { userId: req.params.userId })
    .getMany()
    .then(
      events => {
        let currentEvent;
        if (events.length > 0) {
          currentEvent = events[0];
          currentEvent.coverImageUrl = getDataUrl(currentEvent.coverImageUrl, ImageType.COMPRESSED);
        } else {
          currentEvent = {}
        }
        return res.status(200).send(currentEvent);
      },
      error => {
        console.error("Error while fetching current event" + error)
        return res.status(500).send({
          type: error.name,
          message: "Could not fetch events"
        })
      });
}

export async function getUpdateNotifications(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  createQueryBuilder(ActivityUpdateLog)
    .innerJoinAndSelect("ActivityUpdateLog.activity", "activity")
    .innerJoin("activity.participants", "user")
    .where("user.id=:userId", { userId: req.params.userId })
    .orderBy("ActivityUpdateLog.createdAt", "DESC")
    .getMany()
    .then(
      updateLogs => {
        const logs = removeDuplicates(updateLogs.slice(0, limit));
        return res.status(200).send(logs);
      },
      error => {
        console.error("Error while fetching update logs:", error);
        return res.status(500).send({ message: "Error while trying to fetch notifications" })
      }
    )
}

//Helper function for removing duplicates, could be improved
function removeDuplicates(array) {
  var filteredArray = [];
  var activityIds = []
  array.forEach(element => {
    if (!activityIds.includes(element.activity.id)) {
      filteredArray.push(element);
      activityIds.push(element.activity.id);
    }
  });
  return filteredArray;
}

export async function firstUpdate(req, res) {
  const userId = req.params.userId;

  // Starts the upload of the user profile image.
  uploadFile(storage, req, res,  (err) => {

    // Check for any faults with the image upload.
    if (err) {
      console.error("Error while processing form data:", err)
      const errorMessage = handleMulterError(err);
      return res.status(400).send(errorMessage)
    }

    getRepository(User).findOne({ id: userId })
      .then(async user => {
        if (user.signupComplete) {
          if (req.file) {
            removeFile(req.file.path);
          }
          return res.status(403).send({ message: "The user has already signed up" });
        }
        const newPwd = req.body.password;
        const input = cleanInput(req.body);

        const [pwdValid, errorMessagePwd] = validatePassword(newPwd, "password");
        const [inputValid, errorMessageUser, errorDetailsUser] = validateUser(input);

        const errorDetails = errorDetailsUser;
        errorDetails["password"] = errorMessagePwd;

        if (!inputValid || !pwdValid) {
          if (req.file){
            removeFile(req.file.path)
          }

          res.status(400).send({
            message: errorMessagePwd+"\n"+errorMessageUser,
            details: errorDetails})
          return;
        }

        const updatedUser = updateEntityFields(user, input, possibleInputFields);

        updatedUser.signupComplete = true;
        updatedUser.password = bCrypt.hashSync(input.password, parseInt(process.env.SALT_ROUNDS, 10));
        
        const {pathToSave, newFilePaths, compressionDone} = await compressAndResize(req.file, 40)
        
        if (req.file) {
          removeFile(req.file.path); // Remove the original file to only save the compressed.
        }

        if (pathToSave) {
          updatedUser.profileImageUrl = pathToSave;
        }
        
        if (compressionDone) {
          getRepository(User).save(updatedUser).then(response => {
            response.password = undefined;
            res.status(200).send(response);
          })
          .catch(error => {
            console.error("Error while saving user updates: ", error);
            removeAllFiles(newFilePaths);
            res.status(500).send({message: "Could not update user."})
          });
        } else {
          res.status(400).send({message: "Could not upload the image."})
          removeAllFiles(newFilePaths);
          return
        }
      })
      .catch(error => {
        if (req.file){
          removeFile(req.file.path);
        }
        console.error("Error while updating user for the first time: ", error)
        if (error.response) {
          return res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
          return res.status(500).send(error.request);
        } else {
          return res.status(500).send(error.message);
        }
      })
    })
  };

  export async function logoutUser(req, res) {
    // Removes refresh token
    const userId = req.decoded.userId;
    const user = await getRepository(User)
      .findOne({ id: userId })
      .catch(error => {
        console.error("Error while fethcing user to logout");
        res.status(500).send({
          type: error.name,
          message: "Error while trying to log out user."
        })
        return
      });
    if (!user) {
      res.status(400).send({message: "The user does not exists."})
      return
    }
    user.refreshToken = null;
    getRepository(User).save(user).then(usr => {
      res.status(204).send();
    })
};

export async function deleteProfileImage(req, res) {
  const userId = req.params.userId;

  const user = await getRepository(User).findOne({id: userId});

  if (!user) {
    res.status(400).send({message: "No user with the provided id"})
  }

  if (user.profileImageUrl){
    const filePath = user.profileImageUrl.split(":")[1];
    user.profileImageUrl = null;
    getRepository(User).save(user).then(user => {
      removeAllFiles([filePath, filePath.replace(ImageType.COMPRESSED, ImageType.MINIATURE)])
      return res.status(204).send();
    }).catch(error => {
      console.error("Error while saving user with no image: ", error)
      return res.status(500).send({
        type: error.name,
        message: "Error while trying to remove profile image"
      })
    })
    } else {
      res.status(204).send();
    }
  } 

export async function addPlayerId(req, res) {
  const userId = req.params.userId;
  const playerId = req.body.playerId;

  if (!playerId) {
    return res.status(400).send({message: "No playerId specified"});
  }

  const playerIdRecord = new PlayerId();
  playerIdRecord.id = playerId;
  playerIdRecord.user = userId;

  const user = await getRepository(User).findOne({id: userId})

  if (user) {
    getRepository(PlayerId).save(playerIdRecord).then(record => {
      return res.status(200).send(record);
    }).catch(error => {
      console.error("Error while saving playerId:", error);
      return res.status(500).send({
        type: error.name,
        message: "Error while trying to register playerId for user."
      })
    });
  } else {
    return res.status(400).send({message: "No user exists with the provided id"});
  }
}