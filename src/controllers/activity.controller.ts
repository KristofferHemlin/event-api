import { getRepository } from 'typeorm';
import Activity from '../entities/activity.entity';
import Event from '../entities/event.entity';
import User from '../entities/user.entity';

export async function createActivity(req, res) {
  const event = await getRepository(Event).findOne({id: req.body.eventId});
  const activity = new Activity();

  activity.title = req.body.title;
  activity.description = req.body.description;
  activity.event = event;

  getRepository(Activity).save(activity)
  .then(response => {
    return res.send({
      message: `Successfully created the activity ${req.body.title}.`
    })
  })
  .then(error => {
    return res.send({
      message: `Could not create the activity ${req.body.title}.`
    })
  })

}

export async function getAllActivities(req, res) {
  getRepository(Activity).find({relations: ['participants']})
  .then(activities => {
    res.send(activities);
  })
  .then(error => {
    res.send(error);
  })
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
// FIXME: Temporary function, merge this functionality into the PUT route.
export async function addUserToActivity(req, res){
  const activity = await getRepository(Activity).findOne({id: req.params.activityId}, {relations: ['participants']});
  const user = await getRepository(User).findOne({id: req.body.userId});

  console.log(user);
  console.log(activity);

  activity.participants.push(user);

  getRepository(Activity).save(activity)
  .then(response => {
    res.send({message: `Successfully added ${user.firstName} ${user.lastName} to activity ${activity.title}.`})
  })
  .catch(error => {
    res.send(error);
  })

}
