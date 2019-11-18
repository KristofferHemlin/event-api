import ApplicationError from "./ApplicationError";

export default class InputNotValidError extends ApplicationError {
    constructor(message, details?) {
        super(message || "One or more fields are wrong", 400, details)
    }
}