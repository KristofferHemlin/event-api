import { getRepository } from 'typeorm';
import Activity from '../entities/activity.entity';
import Event from '../entities/event.entity';
import User from '../entities/user.entity';

export async function createActivity(req, res) {
  const event = await getRepository(Event).findOne({id: req.body.eventId}, {relations: ['company']});

  if(!event){
    return res.send({
      message: 'No event could be found for the provided id.',
    })
  }

  const activity = new Activity();
  activity.title = req.body.title;
  activity.description = req.body.description;
  activity.event = event;
  activity.company = event.company;

  getRepository(Activity).save(activity)
  .then(response => {
    return res.send({
      message: `Successfully created the activity ${req.body.title}.`
    })
  })
  .catch(error => {
    return res.send({
      message: `Could not create the activity ${req.body.title}.`
    })
  })

}

export async function getAllActivities(req, res) {
  getRepository(Activity).find({relations: ['participants', 'company']})
  .then(activities => {
    return res.send(activities);
  })
  .catch(error => {
    return res.send(error);
  })
}

export async function getActivity(req, res) {
  getRepository(Activity).findOne({id: req.params.activityId})
    .then(activity => res.status(200).send(activity), error => res.status(500).send({message: "The activity could not be fetched."}));
}

export async function deleteActivity(req, res) {
  const activity = await getRepository(Activity).findOne({id: req.params.activityId});

  let title = activity.title;

  getRepository(Activity).remove(activity)
  .then(response => {
    res.send({message: `Successfully deleted activity ${title}.`})
  })
  .catch(error => {
    res.send(error)
  })
}

export async function addUserToActivity(req, res){
  const activity = await getRepository(Activity).findOne({id: req.params.activityId}, {relations: ['participants', 'event']});
  const user = await getRepository(User).findOne({id: req.body.userId}, {relations: ['events']});

  // Check so that he activity is not empty.
  if(!activity){
    return res.send({
      message: 'Could not find an activity with the provided id.',
    })
  }

  // Check so that he user is not empty.
  if(!user){
    return res.send({
      message: 'Could not find a user with the provided id.',
    })
  }

  // Check if the user is a member of the the parent event.
  if (user.events.find(event => event.id === activity.event.id)){
    activity.participants.push(user);

    getRepository(Activity).save(activity)
    .then(response => {
      return res.send({message: `Successfully added ${user.firstName} ${user.lastName} to activity ${activity.title}.`})
    })
    .catch(error => {
      return res.send(error);
    })
  } else {
    return res.send({
      message: 'The user is not a participant in the activity parent event!',
    })
  }
}
