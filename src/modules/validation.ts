import validator from 'validator';
import * as moment from 'moment';

export function validateFields(input, requiredFields) {
    let detailedMessage = {};
    let isValid = true;

    requiredFields.map(field => {
        if (!input[field]){
            detailedMessage[field] = "Required field"
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

    const requiredFields = ["title", "startTime", "endTime", "location"];
    let [isValid, detailedMessage] = validateFields(activity, requiredFields)

    if (activity.startTime) {
        if (!moment(activity.startTime, "YYYY-MM-DD HH:mm", true).isValid()){
            detailedMessage["startTime"] = "Must have format YYYY-MM-DD HH:mm";
            isValid = false;
        }
    }

    if (activity.endTime) {
        if (!moment(activity.endTime, "YYYY-MM-DD HH:mm", true).isValid()){
            detailedMessage["endTime"] = "Must have format YYYY-MM-DD HH:mm";
            isValid = false;
        } else {
            if (!validator.isAfter(activity.endTime, activity.startTime)) {
                detailedMessage["endTime"] = `Must be after startTime (${activity.startTime})`;
                isValid = false;
            }
        }
    }

    const errorMessage = createErrorMessage(detailedMessage);

    return [isValid, errorMessage, detailedMessage]

}

export function validateEvent(event) {
    const requiredFields = ["title", "startTime", "endTime", "location"];
    let [isValid, detailedMessage] = validateFields(event, requiredFields);

    const dateFormats = ["YYYY-MM-DD HH:mm", "YYYY-MM-DD"];

    if (event.startTime) {
        if (!moment(event.startTime, dateFormats, true).isValid()) {
            detailedMessage["startTime"] = "Must have format YYYY-MM-DD HH:mm or YYYY-MM-DD";
            isValid = false;
        }
    }

    if (event.endTime) {
        if (!moment(event.endTime, dateFormats, true).isValid()){
            detailedMessage["endTime"] = "Must have format YYYY-MM-DD HH:mm";
            isValid = false;
        } else {
            if (!validator.isAfter(event.endTime, event.startTime) && event.startTime !== event.endTime) {
                detailedMessage["endTime"] = `Must be after startTime (${event.startTime})`;
                isValid = false;
            }
        }
    }

    const errorMessage = createErrorMessage(detailedMessage);

    return [isValid, errorMessage, detailedMessage]
}

export function validateUser(user) {
    const requiredFields = ["email", "firstName", "lastName", "phone"];

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

function createErrorMessage(detailedMessage) {
    let prettyFields = {"firstName": "First Name", "lastName": "Last Name", 
        "phone": "Phone", "email": "Email", "title": "Title",
        "startTime": "Start time", "endTime": "End time", "location": "Location"}
    
    const messageFields = Object.keys(detailedMessage);
    
    let message;
    if (messageFields.length > 1) {        
        const lastField = messageFields.pop();
        const firstField = messageFields.pop();
        let messageStart = "The "+prettyFields[firstField];    
        message = messageFields.reduce((message, field) => {
            return message + ", "+ prettyFields[field]
        }, messageStart)
        message += " and "+prettyFields[lastField] + " fields are wrong"

    } else if (messageFields.length === 1) {
        message = "The "+prettyFields[messageFields[0]]+ " field is wrong"
    } else {
        message = ""
    }
    
    return message;
}
