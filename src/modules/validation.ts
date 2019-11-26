import validator from 'validator';
import * as moment from 'moment';

import Event from "../entities/event.entity";
import User from "../entities/user.entity";
import Activity from "../entities/activity.entity";

export function validateFields(input, requiredFields) {
    let detailedMessage = {};
    let isValid = true;

    requiredFields.map(field => {
        if (!input[field]){
            detailedMessage[field] = "Required field"
            isValid = false;
        } else if (input[field] === "null"){
            detailedMessage[field] = "Cannot be null"
            isValid = false;
        } else {
            if (validator.isEmpty(input[field], {ignore_whitespace:true})) {
                detailedMessage[field] = "Cannot be empty";
                isValid = false;
            }
        }
    })
    return [isValid, detailedMessage]
}

export function validateActivity(activity) {
    const dateFormats = ["YYYY-MM-DD HH:mm"];
    return validateHappening(activity, dateFormats);
}

export function validateEvent(event) {
    const dateFormats = ["YYYY-MM-DD HH:mm", "YYYY-MM-DD"];
    return validateHappening(event, dateFormats);
}

export function validateUser(user) {
    const requiredFields = ["email", "firstName", "lastName"];

    let [isValid, detailedMessage] = validateFields(user, requiredFields);

    if (user.email) {
        if (!validator.isEmail(user.email)) {
            detailedMessage["email"] = "Must be an email address";
            isValid = false;
        }
    }

    if (user.phone) {
        if (!validator.isMobilePhone(user.phone)) {
            detailedMessage["phone"] = "Must be a phone number";
            isValid = false;
        }
    }

    const errorMessage = createErrorMessage(detailedMessage);

    return [isValid, errorMessage, detailedMessage];
}

export function validatePassword(pwd:string, fieldName:string, oldPwd?:string){

    let isValid = true;
    let errorMessage = "";
    
    if (pwd) {
        if (validator.isEmpty(pwd, {ignore_whitespace:true}) || pwd.length < 6) {
            isValid = false;
            errorMessage = "Password need to be at least 6 characters"
        }
    } else {
        isValid = false;
        errorMessage = "Password required"
    }

    if (oldPwd){
        if (pwd === oldPwd) {
            isValid = false;
            errorMessage = "New password cannot be the same as the current password"
        }
    }
    return [isValid, errorMessage]
}

export function createErrorMessage(detailedMessage) {
    let prettyFields = {"firstName": "First Name", "lastName": "Last Name", 
        "phone": "Phone", "email": "Email", "title": "Title",
        "startTime": "Start Time", "endTime": "End Time", "location": "Location"}
    
    const messageFields = Object.keys(detailedMessage);
    
    let message;
    if (messageFields.length > 1) {        
        const lastField = messageFields.pop();
        const firstField = messageFields.pop();
        let messageStart = "The "+prettyFields[firstField];    
        message = messageFields.reduce((message, field) => {
            return message + ", "+ prettyFields[field]
        }, messageStart)
        message += " and "+prettyFields[lastField] + " fields are incorrect"

    } else if (messageFields.length === 1) {
        const field = messageFields[0];
        message = "The "+prettyFields[field]+ " field is incorrect: "+detailedMessage[field];
    } else {
        message = ""
    }
    
    return message;
}

export function validateActivityParticipants(activity: Activity, participants: User[], inputUsers: string[]) {
    let allUsersValid = true;
    let invalidUsers = [];
    participants.forEach(user => {
        if (!user.events.find(event => { return event.id === activity.event.id })){
            allUsersValid = false;
            invalidUsers.push(user.email);
        }
    })
    const userEmail = participants.map(user => {return user.email})
    const nonUsers = inputUsers.filter(email => {
        return !userEmail.includes(email);
    });
    if (nonUsers.length > 0) {
        allUsersValid = false;
    }

    const [errorMessage, errorDetails] = getBulkErrorMessage("activity", invalidUsers, nonUsers)
    return [allUsersValid, errorMessage, errorDetails]
}

export function validateEventParticipant(event: Event, participants: User[], inputUsers: string[]) {
    let allUsersValid = true;
    let invalidUsers = []
    participants.forEach(user => {
        if (user.company.id !== event.company.id){
        allUsersValid = false;
        invalidUsers.push(user.email);
        }
    })

    const userEmail = participants.map(user => {return user.email})
    const nonUsers = inputUsers.filter(email => {
        return !userEmail.includes(email);
    });
    if (nonUsers.length > 0) {
        allUsersValid = false;
    }

    const [errorMessage, errorDetails] = getBulkErrorMessage("event", invalidUsers, nonUsers)
    return [allUsersValid, errorMessage, errorDetails]
}

function validateHappening(happening, dateFormats) {
    const requiredFields = ["title", "startTime", "endTime", "location"];
    let [isValid, detailedMessage] = validateFields(happening, requiredFields);

    const [startTimeValid, startTimeMessage] = validateTime(happening.startTime, dateFormats);
    if (!startTimeValid) {
        detailedMessage["startTime"] = startTimeMessage;
        isValid = false;
    }
    const [endTimeValid, endTimeMessage] = validateTime(happening.endTime, dateFormats, happening.startTime);
    if (!endTimeValid) {
        detailedMessage["endTime"] = endTimeMessage;
        isValid = false;
    }

    const errorMessage = createErrorMessage(detailedMessage);

    return [isValid, errorMessage, detailedMessage]
}

function validateTime(time, validFormats: string[], earlierTime?) {
    let message: string;
    let isValid: boolean = true;

    if (time) {
        if (!moment(time, validFormats, true).isValid()){
            message = "Must have format "+validFormats.join(" or ");
            isValid = false;
        }

        if (validator.isAfter("1970-01-01", time)) {
            message = "Date is too long ago";
            isValid = false;
        }

        if (earlierTime) {
            if (!validator.isAfter(time, earlierTime) && earlierTime !== time) {
                message = `Must be after Start Time (${earlierTime})`;
                isValid = false;
            }
        }
    }

    return [isValid, message];
}

function getBulkErrorMessage(happeningType, invalidUsers, nonUsers) {
    let errorMessage = "";
    let errorDetails = {}
    if (invalidUsers.length > 0) {
        if (happeningType === "event") {
            if (invalidUsers.length > 1) {
                errorMessage += invalidUsers.length+ " users belong to the wrong company. ";
            } else {
                errorMessage += invalidUsers.length+ " user belongs to the wrong company. "
            }
        } else {
            if (invalidUsers.length > 1) {
                errorMessage += invalidUsers.length+ " users are not a participant on the parent event. ";
            } else {
                errorMessage += invalidUsers.length+ " user is not a participant on the parent event. "
            }
        }
      errorDetails["nonParticipants"] = invalidUsers;
    }
    if (nonUsers.length > 0) {
        if (nonUsers.length > 1) {
            errorMessage += nonUsers.length+" emails are not registered.";
        } else {
            errorMessage += nonUsers.length+ " email is not registered."
        }
      errorDetails["nonUsers"] = nonUsers;
    }
  
    return [errorMessage.trim(), errorDetails]
  }
