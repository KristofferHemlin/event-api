import ApplicationError from "./ApplicationError";

export default class RequestNotValidError extends ApplicationError {
    constructor(message, details?) {
        super(message || "The request is not valid.", 400, details)
    }
}