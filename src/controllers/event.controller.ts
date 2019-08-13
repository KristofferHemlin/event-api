import {getRepository} from "typeorm";
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
  const event = await getRepository(Event).findOne({id: req.body.eventId });

  event.title = req.body.title;
  event.description = req.body.description;

  getRepository(Event).save(event)
  .then(response => {
    res.send({
      message: `Successfully updated project ${event.id}.`,
    })
  })
  .catch(error => {
    res.send({
      message: `Could not update event ${event.id}.`,
    })
  })

}

export async function getAllEvents(req, res){
  getRepository(Event).find({relations: ['participants', 'activities']})
  .then(events => {
    res.send(events);
  })
  .catch(error => {
    res.send(error);
  })
}
// FIXME: Implement check to see if user is part of company.
export async function addUserToEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId });
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants']});

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

  let theEvent = await getRepository(Event).findOne({id: req.params.eventId }, {relations: ['activities']});

  // Try to remove the activities first.
  getRepository(Activity).remove(theEvent.activities)
  .then(response => {
      getRepository(Event).remove(theEvent)
      .then(response2 => {
        return res.send({
          message: `The event ${theEvent.title} was deleted.`,
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

  if(!user){
    return res.send({
      message: 'No user could be found with that id.',
    })
  }

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
