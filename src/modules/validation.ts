import validator from 'validator';
import * as moment from 'moment';

export function validateFields(input, requiredFields) {
    let errorMessage = {};
    let isValid = true;

    requiredFields.map(field => {
        if (!input[field]){
            errorMessage[field] = "Required field"
            isValid = false;
        } else {
            if (validator.isEmpty(input[field], {ignore_whitespace:true})) {
                errorMessage[field] = "Cannot be empty";
                isValid = false;
            }
        }
    })
    return [isValid, errorMessage]
}

export function validateActivity(activity) {

    const requiredFields = ["title", "startTime", "endTime", "location"];
    let [isValid, errorMessage] = validateFields(activity, requiredFields)

    if (activity.startTime) {
        if (!moment(activity.startTime, "YYYY-MM-DD HH:mm", true).isValid()){
            errorMessage["startTime"] = "Must have format YYYY-MM-DD HH:mm";
            isValid = false;
        }
    }

    if (activity.endTime) {
        if (!moment(activity.endTime, "YYYY-MM-DD HH:mm", true).isValid()){
            errorMessage["endTime"] = "Must have format YYYY-MM-DD HH:mm";
            isValid = false;
        } else {
            if (!validator.isAfter(activity.endTime, activity.startTime)) {
                errorMessage["endTime"] = `Must be after startTime (${activity.startTime})`;
                isValid = false;
            }
        }
    }

    return [isValid, errorMessage]

}

export function validateEvent(event) {
    const requiredFields = ["title", "startTime", "endTime", "location"];
    let [isValid, errorMessage] = validateFields(event, requiredFields);

    const dateFormats = ["YYYY-MM-DD HH:mm", "YYYY-MM-DD"];

    if (event.startTime) {
        if (!moment(event.startTime, dateFormats, true).isValid()) {
            errorMessage["startTime"] = "Must have format YYYY-MM-DD HH:mm or YYYY-MM-DD";
            isValid = false;
        }
    }

    if (event.endTime) {
        if (!moment(event.endTime, dateFormats, true).isValid()){
            errorMessage["endTime"] = "Must have format YYYY-MM-DD HH:mm";
            isValid = false;
        } else {
            if (!validator.isAfter(event.endTime, event.startTime) && event.startTime !== event.endTime) {
                errorMessage["endTime"] = `Must be after startTime (${event.startTime})`;
                isValid = false;
            }
        }
    }

    return [isValid, errorMessage]
}

export function validateUser(user) {
    const requiredFields = ["email", "firstName", "lastName", "phone"];

    let [isValid, errorMessage] = validateFields(user, requiredFields);

    if (user.email) {
        if (!validator.isEmail(user.email)) {
            errorMessage["email"] = "Must be an email address";
            isValid = false;
        }
    }

    if (user.phone) {
        if (!validator.isMobilePhone(user.phone)) {
            errorMessage["phone"] = "Must be a phone number";
            isValid = false;
        }
    }
    return [isValid, errorMessage];
}

export function validatePassword(pwd:string, fieldName:string, oldPwd?:string){

    let isValid = true;
    let errorMessage = {}
    
    if (pwd) {
        if (validator.isEmpty(pwd, {ignore_whitespace:true}) || pwd.length < 6) {
            isValid = false;
            errorMessage[fieldName] = "Need to be at least 6 characters"
        }
    } else {
        isValid = false;
        errorMessage[fieldName] = "Required"
    }

    if (oldPwd){
        if (pwd === oldPwd) {
            isValid = false;
            errorMessage[fieldName] = "Cannot be the same as the current password"
        }
    }
    return [isValid, errorMessage]
}
