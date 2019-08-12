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
  const user = await getRepository(User).findOne({id: req.body.userId });
  const event = await getRepository(Event).findOne({ id: req.body.eventId }, {relations: ['participants']});

  // finds index of the user and removes it from the event.
  event.participants.splice(event.participants.indexOf(user), 1);

  await getRepository(Event).save(event)
  .then(response => {
    res.send({
      message: 'User successfully removed from the event!',
    })
  })
  .catch(error => {
    res.send({
      message: 'Could not remove the user from the event.',
    })
  })
}
