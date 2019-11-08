import {getRepository, Equal, createQueryBuilder} from "typeorm";
import Event from '../entities/event.entity';
import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Activity from '../entities/activity.entity';

import {validateEvent} from '../modules/validation';
import { getStorage, uploadFile, removeFile, getDataUrl, resizeAndCompress, ImageType, removeAllFiles } from "../modules/fileHelpers";

const storage = getStorage("public/original", "eventImage");

export async function createEvent(req, res) {
  
  uploadFile(storage, req, res, async (err) => {
    if (err) {
      console.error("Error from multer: ", err)
      return res.status(500).send({
        type: err.name,
        message: "Error while parsing form data"
      })
    }

    let company = await getRepository(Company).findOne({ id: req.body.companyId });
  
    if(!company){
      if (req.file) {
        removeFile(req.file.path);
      }
      return res.status(404).send({
        message: 'No company was found with the provided company id.',
      });
    }
  
    const [inputValid, errorInfo] = validateEvent(req.body);
  
    if (!inputValid) {
      if (req.file) {
        removeFile(req.file.path)
      }
      res.status(400).send({
        message: "One or more fields are wrong.",
        details: errorInfo})
      return;
    }
  
    const event = new Event();
    event.title = req.body.title;
    event.description = req.body.description;
    event.company = company;
    event.startTime = req.body.startTime;
    event.endTime = req.body.endTime;
    event.location = req.body.location;
    event.goodToKnow = req.body.goodToKnow;

    if (req.file) {
      event.coverImageUrl = req.file.mimetype+":"+req.file.path;
      resizeAndCompress(req.file.path, 50);
    }
  
    getRepository(Event).save(event)
    .then(event => {
      return res.status(201).send(event);
    })
    .catch(error => {
      if (req.file) {
        removeAllFiles(req.file.path);
      }
      return res.status(500).send({
        type: error.name,
        message: "Error while creating event. Event not created."});
    })
  })
}

export async function getEventById(req, res) {
  const eventId = req.params.eventId;
  getRepository(Event)
    .findOne({id: eventId})
    .then(event => {
      event.coverImageUrl = getDataUrl(event.coverImageUrl, ImageType.COMPRESSED);
      res.status(200).send(event)
    }).catch(error => {
      console.error("Error while fetching event: ", error)
      res.status(500).send({
        type: error.name,
        message: "Could not fetch event"})
    })
}

export async function updateEvent(req, res){
  const event = await getRepository(Event).findOne({id: req.params.eventId });

  if (!event) {
    return res.status(400).send({message: "Specified event does not exit."})
  }

  uploadFile(storage, req, res, (err) => {

    if (err) {
      console.error("Error from multer: ", err)
      return res.status(500).send({
        type: err.name,
        message: "Error while uploading image"})
    }

    const [inputValid, errorInfo] = validateEvent(req.body);
  
    if (!inputValid) {
      if (req.file) {
        removeFile(req.file.path);
      }
      res.status(400).send({
        message: "One or more fields are wrong.",
        details: errorInfo})
      return;
    }
    event.title = req.body.title;
    event.description = req.body.description === "null"? null: req.body.description;
    event.startTime = req.body.startTime;
    event.endTime = req.body.endTime;
    event.location = req.body.location;
    event.goodToKnow = req.body.goodToKnow === "null"? null: req.body.goodToKnow;
    
    let oldFilePath;
    if (event.coverImageUrl) {
      oldFilePath = event.coverImageUrl.split(":")[1];
    } else {
      oldFilePath = null;
    }

    if (req.file) {
      event.coverImageUrl = req.file.mimetype+":"+req.file.path;
    }

    getRepository(Event).save(event)
    .then(response => {
      if (req.file) {
        resizeAndCompress(req.file.path, 50);
        removeAllFiles(oldFilePath);
      }
      return res.status(200).send(response)
    })
    .catch(error => {
      if (req.file) {
        removeAllFiles(req.file.path);
      }
      console.error("Error while updating event:", error);
      return res.status(500).send({
        type: error.name,
        message: `Could not update event ${event.id}.`,
      })
    })
  })
}

export async function getAllEvents(req, res){
  getRepository(Event).find({relations: ['participants', 'activities', 'company'], order: {id: "ASC"}})
  .then(events => {
    // const eventsWithImages = events.map(event => {
    //   event.coverImageUrl = getDataUrl(event.coverImageUrl);
    //   return event;
    // })
    return res.status(200).send(events);
  })
  .catch(error => {
    console.error("Error while fetching events:", error)
    return res.status(500).send({message:"Could not fetch events."});
  })
}

export async function getEventParticipants(req, res) {
  // get all users on specified event

  const sortableColumns = ["id", "firstName", "lastName", "companyDepartment"];
  const sortableOrder = ["ASC", "DESC"];
  const sortParams = req.query.sort;
  let column, order;
  if (sortParams) {
    [column, order] = sortParams.split(":");
  } else {
    [column, order] = ["id", "ASC"];  
  }

  if (!sortableColumns.includes(column) || !sortableOrder.includes(order.toUpperCase())){
    return res.status(400).send(
      {message: `Specified column or order to sort by is wrong.`});
  }
  
  createQueryBuilder(User)
    .innerJoin("User.events", "ue", "ue.id=:eventId", {eventId: req.params.eventId})
    .orderBy(`User.${column}`, order.toUpperCase())
    .getMany()
    .then(
      users => {
        // const usersWithImages = users.map(user => {
        //   user.profileImageUrl = getDataUrl(user.profileImageUrl);
        //   return user;
        // })
        return res.status(200).send(users)}, 
      error => {
        console.error("Error while fetching event participants: "+error); 
        return res.status(500).send({
          type: error.name,
          message: "Could not fetch event participants"})
      }
    )
}

export async function getEventParticipant(req, res) {
  createQueryBuilder(User)
  .innerJoin("User.events", "ue")
  .where("ue.id = :eventId", { eventId: req.params.eventId})
  .andWhere("User.id = :userId",   { userId: req.params.userId })
  .getOne()
  .then(user => {
    user.profileImageUrl = getDataUrl(user.profileImageUrl, ImageType.COMPRESSED);
    return res.status(200).send(user);
  })
  .catch(error => {
    console.error("Error while fetching event participants:", error)
    return res.status(500).send({ 
      type: error.name,
      message:'Error while fetching user.' });
  })
};

export async function getEventActivities(req, res) {
  createQueryBuilder(Activity)
  .where("Activity.event =:eventId", {eventId: req.params.eventId})
  .orderBy("Activity.id", "ASC")
  .getMany()
  .then(activities => {
    // const activitiesWithImage = activities.map(activity => {
    //   activity.coverImageUrl = getDataUrl(activity.coverImageUrl);
    //   return activity;
    // })
    res.status(200).send(activities)},
    error => {
      console.error("Error while trying to fetch event activities: "+error);
      return res.status(500).send({message: "Could not fetch event activities"})}
  )
  .catch(error => {
    console.error("Error while trying to fetch event activities: "+error);
    return res.status(500).send({message: "Error while fetching event activities"})
  })
}

export async function addUserToEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId }, {relations: ['company']});
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants', 'company']});

  if (!event) {
    return res.status(404).send({message: "No event exists for the provided id."})
  }

  if(!user){
    return res.status(404).send({
      message: 'No user exists for the provided id.',
    })
  }

  if(!user.company){
    return res.status(400).send({
      message: 'User is not associated to any company.',
    })
  }

  // Check if the user is from the same company.
  if(user.company.id !== event.company.id){
    return res.status(400).send({
      message: 'The user is not assigned to the same company as the event!',
    })
  }

  event.participants.push(user);

  await getRepository(Event).save(event)
  .then(response => {
    res.status(200).send({
      message: `${user.firstName} ${user.lastName} successfully added to the event ${event.title}!`,
    })
  })
  .catch(error => {
    console.error("Error while adding user to event:", error)
    res.status(500).send({
      type: error.name,
      message: `Could not add the user ${user.firstName} ${user.lastName} to the event ${event.title}.`,
    })
  })
}

export async function deleteEvent(req, res){

  let event = await getRepository(Event).findOne({id: req.params.eventId }, {relations: ['activities']});

  if(!event){
    return res.status(404).send({
      message: 'No event found for the provided id.',
    })
  }

  let coverImage;
  if (event.coverImageUrl) {
    coverImage = event.coverImageUrl.split(":")[1];
  } else {
    coverImage = null;
  }

  // Try to remove the activities first.
  getRepository(Activity).remove(event.activities)
  .then(response => {
    event.activities.map(activity => {
      removeAllFiles(activity.coverImageUrl)});
      getRepository(Event).remove(event)
      .then(response2 => {
        removeAllFiles(coverImage);
        return res.status(204).send();
      })
      .catch(error2 => {
        console.error("Error while removing event: ", error2);
        return res.status(500).send({
          message: "Could not remove event."
        })
      })
  })
  .catch(error => {
    console.error("Error while removing an event:", error);
    return res.status(500).send({
      type: error.type,
      message: "Error while removing event",
    })
  })
};

export async function removeUserFromEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId }, {relations: ['events', 'activities']});
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants', 'activities']});

  // ...Check if the user was empty.
  if(!user){
    return res.status(404).send({
      message: 'No user could be found with that id.',
    })
  }

  // ...Check if the event was empty.
  if(!event){
    return res.status(404).send({
      message: 'Could not find any event with that id.',
    })
  }

  // Check if the user is a participant of the event.
  if(!event.participants.find(participant => participant.id === user.id)){
    return res.status(400).send({
      message: 'The user is not a participant of the event.',
    });
  }

  // finds index of the event and removes it from the user.
  user.events.splice(user.events.indexOf(event), 1);

  // Finds all related activites and removes the user from them.
  user.activities = user.activities.filter(activity => {
    event.activities.forEach(eventActivity => {
      if (activity.id === eventActivity.id){
        return;
      } else {
        return activity;
      }
    })
  })

  getRepository(User).save(user)
  .then(response => {
    return res.status(204).send();
  })
  .catch(error => {
    console.error("Error while removing user from event:", error);
    res.status(500).send({
      message: `Could not remove ${user.firstName} ${user.lastName} from the event ${event.title}.`,
    })
  })
}

export async function deleteCoverImage(req, res) {
  const eventId = req.params.eventId;

  const event = await getRepository(Event).findOne({id: eventId});

  if (!event) {
    res.status(400).send({message: "No event with the provided id"})
  }

  if (event.coverImageUrl){
    const filePath = event.coverImageUrl.split(":")[1];
    event.coverImageUrl = null;
    getRepository(Event).save(event).then(event => {
      removeAllFiles(filePath)
      return res.status(204).send();
    }).catch(error => {
      console.error("Error while saving event with no image: ", error)
      return res.status(500).send({
        type: error.name,
        message: "Error while trying to remove cover image"
      })
    })
    } else {
      res.status(204).send();
    }
}


