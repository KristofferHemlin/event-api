import {getRepository} from "typeorm";
import Event from '../entities/event.entity';
import Company from '../entities/company.entity';
import User from '../entities/user.entity';

export async function createEvent(req, res) {
  getRepository(Company).findOne({ id: req.body.companyId },{relations: ['events']})
  .then(company => {

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
        message: 'Successfully saved the event.',
      })
    })
    .catch(error => {
      res.send(error);
    })
  })
  .catch(error => {
    res.send(error);
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

export async function addUserToEvent(req, res){
  const user = await getRepository(User).findOne({id: req.body.userId });
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants']});

  event.participants.push(user);

  await getRepository(Event).save(event)
  .then(response => {
    res.send({
      message: 'User successfully added to the event!',
    })
  })
  .catch(error => {
    res.send({
      message: 'Could not add the user to the event.',
    })
  })
}

export async function deleteEvent(req, res){
  res.send({
    message: 'Route not yet developed!',
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
    return event.activities.find(eventActivity => eventActivity.id !== activity.id);
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
