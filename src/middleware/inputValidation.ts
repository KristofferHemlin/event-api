import {validateUser, validateActivity, validateEvent} from "../modules/validation";
import {cleanInput, removeFile} from "../modules/helpers";

export function cleanAndValidateUserData(req, res, next) {
    cleanAndValidate(req, res, next, validateUser);
}

export function cleanAndValidateActivity(req, res, next) {
    cleanAndValidate(req, res, next, validateActivity);
}

export function cleanAndValidateEvent(req, res, next) {
    cleanAndValidate(req, res, next, validateEvent);
}

function cleanAndValidate(req, res, next, validationFn) {
    const input = cleanInput(req.body);
    const [inputValid, errorMessage, errorDetails] = validationFn(input);
    console.log("input valid:", inputValid);
    if (!inputValid) {
        removeFile(req.file);
        res.status(400).send({message: errorMessage, details: errorDetails, status: 400});
        return;
    }
    next();
}