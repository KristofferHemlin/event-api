import { getRepository, createQueryBuilder } from 'typeorm';
import Activity from '../entities/activity.entity';
import Event from '../entities/event.entity';
import User from '../entities/user.entity';
import ActivityUpdateLog from '../entities/activitylog.entity';

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
  activity.startTime = req.body.startTime;
  activity.endTime = req.body.endTime;
  activity.location = req.body.location;
  activity.niceToKnow = req.body.niceToKnow;

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
  getRepository(Activity).find({relations: ['participants', 'company'], order: {id: "ASC"}})
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
    return res.status(400).send({message: `Specified column or order to sort by is wrong. Available columns: ${sortableColumns}. Available orders: ${sortableOrder}`});
  }

  createQueryBuilder(User)
  .innerJoin("User.activities", "ua")
  .where("ua.id=:activityId", {activityId: req.params.activityId})
  .orderBy(`User.${column}`, order.toUpperCase())
  .getMany()
  .then(
    participants => res.status(200).send(participants), 
    error => {
      console.log(error)
      res.status(500).send("Could not fetch activity participants")})
  .catch(error => res.status(500).send("Error while fetching participants"))
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

export async function updateActivity(req, res) {
  const activityId = req.params.activityId;
  getRepository(Activity).findOne({id: activityId}).then(activity  => {
    if (activity) {
      activity.title = req.body.title? req.body.title : activity.title;
      activity.description = req.body.description? req.body.description : activity.description;
      activity.startTime = req.body.startTime? req.body.startTime : activity.startTime;
      activity.endTime = req.body.endTime? req.body.endTime : activity.endTime;
      activity.location = req.body.location? req.body.location : activity.location;
      activity.niceToKnow = req.body.niceToKnow;
      
      let activityLog = new ActivityUpdateLog();
      activityLog.activity = activity;
      
      getRepository(Activity).save(activity).then(
        response => {
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
              console.log("Error while sending push notification:")
              console.log(error)
            });
          getRepository(ActivityUpdateLog).save(activityLog).then(
            res => {},
            error => console.log("Could not log activity update for activity id: "+activityId));
          res.status(200).send(response)
        },
        error => res.status(500).send("Could not update activity"));
    } else {
      res.status(400).send("No activity found with provided id");
    }
  }, error => res.status(500).send({message: "Cannot fetch activity"}))
  .catch(error => res.status(500).send({message: "Could not update activity"}))
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
        console.log("Error: could not send push:")
        console.log(parsedData);
      }
    });
  });

  request.on('error', function(e) {
    console.log("Error during OneSignal request:");
    console.log(e);
  });

  request.write(JSON.stringify(data));
  request.end();

}