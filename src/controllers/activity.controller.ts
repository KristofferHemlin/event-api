import { getRepository, createQueryBuilder } from 'typeorm';
import Activity from '../entities/activity.entity';
import Event from '../entities/event.entity';
import User from '../entities/user.entity';
import ActivityUpdateLog from '../entities/activitylog.entity';
import {validateActivity} from '../modules/validation';

export async function createActivity(req, res) {
  const eventId = req.body.eventId;
  const event = await getRepository(Event)
    .findOne({id: eventId}, {relations: ['company']})
    .catch(error => {
      console.error("Error while fetching event:", error);
      return res.status(500).send({message: "Error while trying to create the activity."}); 
    });

  if(!event){
    return res.status(400).send({
      message: 'No event could be found for the provided id. Activity not created.',
    })
  }

  const [inputValid, errorInfo] = validateActivity(req.body)

  if (!inputValid) {
    res.status(400).send({
      message: "One or more fields are wrong.",
      details: errorInfo})
    return;
  }

  const activity = new Activity();
  activity.title = req.body.title;
  activity.description = req.body.description;
  activity.event = event;
  activity.company = event.company;
  activity.startTime = req.body.startTime;
  activity.endTime = req.body.endTime;
  activity.location = req.body.location;
  activity.goodToKnow = req.body.goodToKnow;

  getRepository(Activity).save(activity)
    .then(activity => {
      return res.status(201).send({ 
          data: activity,
          message: `Activity ${activity.title} created.`});
    })
    .catch(error => {
      console.error("Error while trying to create an activity:", error);
      return res.status(500).send({
          type: error.name,
          message: `Could not create the activity ${req.body.title}.`
        })
    })
}

export async function getAllActivities(req, res) {
  getRepository(Activity).find({relations: ['participants', 'company'], order: {id: "ASC"}})
  .then(activities => {
    return res.status(200).send(activities);
  })
  .catch(error => {
    return res.status(500).send({
      type: error.name, 
      message: "Could not fetch activities"
    });
  })
}

export async function getActivity(req, res) {
  getRepository(Activity).findOne({id: req.params.activityId})
    .then(
      activity => {return res.status(200).send(activity)})
    .catch(error => {
      console.error("Error while fetching activity:", error);
      return res.status(500).send({
        type: error.name,
        message: "Could not fetch acivity"})
    })
}

export async function getActivityUsers(req, res) {

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
    return res.status(400).send({message: "Specified column or order to sort by is wrong."});
  }

  createQueryBuilder(User)
  .innerJoin("User.activities", "ua")
  .where("ua.id=:activityId", {activityId: req.params.activityId})
  .orderBy(`User.${column}`, order.toUpperCase())
  .getMany()
  .then(
    participants => res.status(200).send(participants))
  .catch(error => {
    console.error("Error while fetching users for activity "+error);
    res.status(500).send({message: "Could not fetch activity participants"})})
}

export async function deleteActivity(req, res) {
  const activity = await getRepository(Activity)
    .findOne({id: req.params.activityId})
    .catch(error => {
      console.error("Error while fetching activity to delete:", error)
      return res.status(500).send({
        type: error.name,
        message: "Could not delete activity."})
    });

  getRepository(Activity).remove(activity)
  .then(_ => {
    res.status(204).send()
  })
  .catch(error => {
    res.status(500).send({
      type: error.name,
      message: "Could not delete activity."
    })
  })
}

export async function addUserToActivity(req, res){
  const activity = await getRepository(Activity)
    .findOne({id: req.params.activityId}, {relations: ['participants', 'event']})
    .catch(error => {
      console.error("Error while fetching activity:", error);
      return res.status(500).send({
        type: error.name,
        message: "Error while trying to add user to activity."})
    });

  const user = await getRepository(User)
    .findOne({id: req.body.userId}, {relations: ['events']})
    .catch(error => {
      console.error("Error while fetching user:", error);
      return res.status(500).send({
        type: error.name,
        message: "Error while trying to add user to activity."})
    });

  // Check so that he activity is not empty.
  if(!activity){
    return res.status(400).send({
      message: 'Could not find an activity with the provided id.',
    })
  }

  // Check so that he user is not empty.
  if(!user){
    return res.status(400).send({
      message: 'Could not find a user with the provided id.',
    })
  }

  // Check if the user is a member of the the parent event.
  if (user.events.find(event => event.id === activity.event.id)){
    activity.participants.push(user);

    getRepository(Activity).save(activity)
    .then(response => {
      return res.status(200).send({message: `Successfully added ${user.firstName} ${user.lastName} to activity ${activity.title}.`})
    })
    .catch(error => {
      return res.status(500).send({
        type: error.name,
        message: "Could not add user to the activity"
      });
    })
  } else {
    return res.status(400).send({
      message: 'The user is not a participant in the activity parent event!',
    })
  }
}

export async function updateActivity(req, res) {
  const activityId = req.params.activityId;
  const activity = await getRepository(Activity)
    .findOne({id: activityId})
    .catch(error => {
      console.error("Error while fetching activity:", error);
      return res.status(500).send({message: "Could fetch the activity to update"})})
  
  if (!activity) {
    return res.status(404).send({message: "No activity found with provided id"});
  }

  const [inputValid, errorInfo] = validateActivity(req.body)

  if (!inputValid) {
    res.status(400).send({
      message: "One or more fields are wrong.",
      details: errorInfo})
    return;
  }

  activity.title = req.body.title;
  activity.description = req.body.description;
  activity.startTime = req.body.startTime;
  activity.endTime = req.body.endTime;
  activity.location = req.body.location;
  activity.goodToKnow = req.body.goodToKnow;
  
  let activityLog = new ActivityUpdateLog();
  activityLog.activity = activity;

  const savedActivity = await getRepository(Activity)
    .save(activity)
    .catch(error => {
      console.error("Error while trying to save activity:", error);
      return res.status(500).send({
        type: error.name,
        message: "Could not update the activity"})
    })

  // send push to all activity participants
  createQueryBuilder(User)
    .innerJoin("User.activities", "au", "au.id=:activityId", {activityId: activityId})
    .getMany()
    .then(users => {
      const recipients = users.map(user => user.id.toString());
      var pushMessage = { 
        app_id: process.env.ONESIGNAL_ID,
        headings: {"en": "Activity Updated", "sv": "Aktivitet uppdaterad"},
        contents: {"en": activity.title, "sv": activity.title},
        android_group: "activity_update",
        include_external_user_ids: recipients
      };
      sendPush(pushMessage);
    })
    .catch(error => {
      console.error("Error while sending push notification:", error);
    });

  // Add activity update log
  getRepository(ActivityUpdateLog).save(activityLog).then(
    _ => {},
    error => console.error("Could not log activity update for activity id: "+activityId, error));

  return res.status(200).send(savedActivity);
  
}

function sendPush(data) {
  var https = require('https');

  var headers = {
    "Content-Type": "application/json; charset=utf-8"
  };
  
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };

  var request = https.request(options, function(response) {  
    response.on('data', function(data) {
      const parsedData = JSON.parse(data.toString());
      if (parsedData.errors) {
        console.error("Error: could not send push:")
        console.error(parsedData);
      }
    });
  });

  request.on('error', function(e) {
    console.error("Error during OneSignal request:");
    console.error(e);
  });

  request.write(JSON.stringify(data));
  request.end();

}