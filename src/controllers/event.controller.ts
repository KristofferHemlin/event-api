import {getRepository, Equal, createQueryBuilder} from "typeorm";
import Event from '../entities/event.entity';
import Company from '../entities/company.entity';
import User from '../entities/user.entity';
import Activity from '../entities/activity.entity';

export async function createEvent(req, res) {
  let company = await getRepository(Company).findOne({ id: req.body.companyId },{relations: ['events']});

  if(!company){
    return res.status(500).send({
      message: 'No company was found with the provided company id.',
    });
  }

  const event = new Event();
  event.title = req.body.title;
  event.description = req.body.description;
  event.company = company;
  event.startTime = req.body.startTime;
  event.endTime = req.body.endTime;
  event.location = req.body.location;
  event.goodToKnow = req.body.goodToKnow;

  getRepository(Event).save(event)
  .then(response => {
    return res.send({
      message: `Successfully saved the event ${event.title}.`,
    })
  })
  .catch(error => {
    return res.send(error);
  })
}

export async function updateEvent(req, res){
  const event = await getRepository(Event).findOne({id: req.params.eventId });

  event.title = req.body.title? req.body.title: event.title;
  event.description = req.body.description? req.body.description: event.description;
  event.startTime = req.body.startTime? req.body.startTime: event.startTime;
  event.endTime = req.body.endTime? req.body.endTime: event.endTime;
  event.location = req.body.location? req.body.location: event.location;
  event.goodToKnow = req.body.goodToKnow;

  getRepository(Event).save(event)
  .then(response => {
    res.send({
      message: `Successfully updated event ${event.id}.`,
    })
  })
  .catch(error => {
    res.send({
      message: `Could not update event ${event.id}.`,
    })
  })

}

export async function getAllEvents(req, res){
  getRepository(Event).find({relations: ['participants', 'activities', 'company'], order: {id: "ASC"}})
  .then(events => {
    res.send(events);
  })
  .catch(error => {
    res.send(error);
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
    return res.status(400).send({message: `Specified column or order to sort by is wrong. Available columns: ${sortableColumns}. Available orders: ${sortableOrder}`});
  }
  
  createQueryBuilder(User)
    .innerJoin("User.events", "ue", "ue.id=:eventId", {eventId: req.params.eventId})
    .orderBy(`User.${column}`, order.toUpperCase())
    .getMany()
    .then(response => res.status(200).send(response), error => {console.log(error); res.status(500).send({message: "Could not fetch event participants"})})
}

export async function getSingleEventParticipant(req, res) {
  createQueryBuilder(User)
  .innerJoin("User.events", "ue")
  .where("ue.id = :eventId", { eventId: req.params.eventId})
  .andWhere("User.id = :userId",   { userId: req.params.userId })
  .getOne()
  .then(user => {
    res.status(200).send(user);
  })
  .catch(err => {
    res.status(500).send({ message:'Error while fetching user.' });
  })
};



export async function getEventActivities(req, res) {
  createQueryBuilder(Activity)
  .where("Activity.event =:eventId", {eventId: req.params.eventId})
  .orderBy("Activity.id", "ASC")
  .getMany()
  .then(
    activities => res.status(200).send(activities),
    error => {
      console.log(error);
      res.status(500).send({message: "Could not fetch event activities"})}
  )
  .catch(error => {
    console.log(error);
    res.status(500).send({message: "Error while fetching event activities"})
  })
}


// FIXME: Implement check to see if user is part of company.
export async function addUserToEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId }, {relations: ['company']});
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants', 'company']});

  if(!user){
    return res.send({
      message: 'No user exists for the provided id.',
    })
  }

  if (!event){
    return res.send({
      message: 'No event exists for the provided id.',
    })
  }

  if(!user.company){
    return res.send({
      message: 'User is not associated to any company.',
    })
  }

  // Check if the user is from the same company.
  if(user.company.id !== event.company.id){
    return res.send({
      message: 'The user is not assigned to the same company as the event!',
    })
  }

  event.participants.push(user);

  await getRepository(Event).save(event)
  .then(response => {
    res.send({
      message: `${user.firstName} ${user.lastName} successfully added to the event ${event.title}!`,
    })
  })
  .catch(error => {
    res.send({
      message: `Could not add the user ${user.firstName} ${user.lastName} to the event ${event.title}.`,
    })
  })
}

export async function deleteEvent(req, res){

  let event = await getRepository(Event).findOne({id: req.params.eventId }, {relations: ['activities']});

  if(!event){
    return res.send({
      message: 'No event found for the provided id.',
    })
  }

  // Try to remove the activities first.
  getRepository(Activity).remove(event.activities)
  .then(response => {
      getRepository(Event).remove(event)
      .then(response2 => {
        return res.send({
          message: `The event ${event.title} was deleted.`,
        })
      })
      .catch(error2 => {
        return res.send({
          message: error2,
        })
      })
  })
  .catch(error => {
    return res.send({
      message: error,
    })
  })
};

export async function removeUserFromEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId }, {relations: ['events', 'activities']});
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants', 'activities']});

  // ...Check if the user was empty.
  if(!user){
    return res.send({
      message: 'No user could be found with that id.',
    })
  }

  // ...Check if the event was empty.
  if(!event){
    return res.send({
      message: 'Could not find any event with that id.',
    })
  }

  // Check if the user is a participant of the event.
  if(!event.participants.find(participant => participant.id === user.id)){
    return res.send({
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

  await getRepository(User).save(user)
  .then(response => {
    res.send({
      message: `${user.firstName} ${user.lastName} successfully removed from the ${event.title}.`,
    })
  })
  .catch(error => {
    res.send({
      message: `Could not remove ${user.firstName} ${user.lastName} from the event ${event.title}.`,
    })
  })
}


