import * as bCrypt from 'bcrypt';
import User from '../entities/user.entity';
import Company from '../entities/company.entity';
import Event from '../entities/event.entity';
import { getRepository, getConnection, createQueryBuilder } from "typeorm";
import { Request, Response } from 'express';
import * as fs from 'fs';

import * as excelToJson from 'convert-excel-to-json';

import * as multer from 'multer';
import ActivityUpdateLog from '../entities/activitylog.entity';
import { validateUser, validatePassword } from '..//modules/validation';
import PlayerId from '../entities/playerId.entity';

// Multer file upload handling.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    let ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, 'profileImage' + '-' + Date.now() + "." + ext)
  }
})

const accepted_extensions = ['jpg', 'jpeg', 'png', 'heic', 'JPG', 'JPEG', 'PNG', 'HEIC'];

var upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    file: 1,
  },
  fileFilter: (req, file, cb) => {
    // if the file extension is in our accepted list
    if (accepted_extensions.some(ext => file.originalname.endsWith("." + ext))) {
      return cb(null, true);
    }

    // otherwise, return error
    return cb({ message: 'Only ' + accepted_extensions.join(", ") + ' files are allowed!' })
  }
}).single('image')


export async function createUser(req, res) {

  const [inputValid, errorInfo] = validateUser(req.body);

  if (!inputValid) {
    res.status(400).send({
      message: "One or more fields are wrong.",
      details: errorInfo})
    return;
  }

  let user = new User();
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.phone = req.body.phone;
  user.email = req.body.email;
  user.isActive = false;

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
        if(user.profileImageUrl){
          let encoding = 'base64';
          let [mimeType, imagePath] = user.profileImageUrl.split(':');
          let imageString = fs.readFileSync(imagePath, encoding);
          user.profileImageUrl = "data:" + mimeType + ";"+encoding+"," + imageString;
        }
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

  upload(req, res, (err) => {

    // Check for any faults with the image upload.
    if (err) {
      console.error("Error while processing form data:", err)
      return res.status(500).send({
        type: err.name,
        message: "Error while processing form data",
        error: err
      });
    }
    const [inputValid, errorInfo] = validateUser(req.body);
  
    if (!inputValid) {
      if (req.file) {
        removeFile(req.file.path);
      }
      res.status(400).send({
        message: "One or more fields are wrong.",
        details: errorInfo})
      return;
    }
  
    userToUpdate.firstName = req.body.firstName;
    userToUpdate.lastName = req.body.lastName;
    userToUpdate.phone = req.body.phone;
    userToUpdate.email = req.body.email;
    userToUpdate.companyDepartment = req.body.companyDepartment;
    userToUpdate.aboutMe = req.body.aboutMe === "null"? null: req.body.aboutMe; // Multer (probably) turns null values into string "null"
    userToUpdate.allergiesOrPreferences = req.body.allergiesOrPreferences === "null"? null: req.body.allergiesOrPreferences;
    
    let oldFilePath;  // Save the old image path so it can be deleted if the update is successfull
    if (userToUpdate.profileImageUrl){
      oldFilePath = userToUpdate.profileImageUrl.split(":")[1];
    } else {
      oldFilePath = null
    }
    
    if (req.file){
      userToUpdate.profileImageUrl = req.file.mimetype+":"+req.file.path;
    }
    
    getRepository(User).save(userToUpdate)
    .then(response => {
      if (req.file){  // Only remove old file if there is a new file
        removeFile(oldFilePath);
      }
        return res.status(200).send(response);
      })
      .catch(error => {
        if (req.file) {
          removeFile(req.file.path);
        }
        console.error("Error while updating user:", error);
        return res.status(500).send({ message: "Could not update user." });
      })
  })

}

export async function deleteUser(req, res) {
  let user = await getRepository(User).findOne({ id: req.params.userId });
  if (!user) {
    return res.status(400).send({ message: "No user exists for the provided id." })
  }

  await getRepository(User).remove(user)
    .then(response => {
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
      result => {
        return res.status(200).send(result);
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
      response => {
        return res.status(200).send(response[0])
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

// Helper function for removing an image. 
const removeFile = (path) => {
  if (path) {
    fs.unlinkSync(path);
  }
};


export async function firstUpdateNoImage(req, res) {
  const userId = req.params.userId;

  getRepository(User).findOne({ id: userId })
    .then(user => {
      if (user.signupComplete) {
        return res.status(403).send({ message: "The user has already signed up" });
      }
    
    const newPwd = req.body.password;
    if (!newPwd) {
      return res.status(400).send({ message: "Need to specify a new password" });
    }

    const [inputValid, errorInfo] = validateUser(req.body);

    if (!inputValid) {
      res.status(400).send({
        message: "One or more fields are wrong.",
        details: errorInfo})
      return;
    }
    
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.phone = req.body.phone;
    user.companyDepartment = req.body.companyDepartment;
    user.signupComplete = true;
    user.password = bCrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS, 10));
    getRepository(User).save(user).then(response => {
      response.password = undefined;
      res.status(200).send(response);
    });
  })
  .catch(error => {
    if (error.response) {
      return res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      return res.status(500).send(error.request);
    } else {
      return res.status(500).send(error.message);
    }
  })
}

export async function firstUpdate(req, res) {
  const userId = req.params.userId;

  // Starts the upload of the user profile image.
  upload(req, res, (err) => {

    // Check for any faults with the image upload.
    if (err) {
      console.error("Error while processing form data:", err)
      return res.status(500).send({
        type: err.name,
        message: "Error while processing form data"
      });
    }

    getRepository(User).findOne({ id: userId })
      .then(user => {
        if (user.signupComplete) {
          if (req.file) {
            removeFile(req.file.path);
          }
          return res.status(403).send({ message: "The user has already signed up" });
        }
        const newPwd = req.body.password;
        const [pwdValid, errorMessagePwd] = validatePassword(newPwd, "password");
        const [inputValid, errorMessageUser] = validateUser(req.body);

        const errorInfo = Object.assign({}, errorMessagePwd, errorMessageUser);

        if (!inputValid || !pwdValid) {
          if (req.file){
            removeFile(req.file.path)
          }

          res.status(400).send({
            message: "One or more fields are wrong.",
            details: errorInfo})
          return;
        }

        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.email = req.body.email;
        user.phone = req.body.phone;
        user.companyDepartment = req.body.companyDepartment;
        user.signupComplete = true;
        user.password = bCrypt.hashSync(req.body.password, parseInt(process.env.SALT_ROUNDS, 10));
        if (req.file){
          user.profileImageUrl = req.file.mimetype+":"+req.file.path;
        }
        
        getRepository(User).save(user).then(response => {
          response.password = undefined;
          res.status(200).send(response);
        });
      })
      .catch(error => {
        if (req.file){
          removeFile(req.file.path)
        }
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
      removeFile(filePath)
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