import ApplicationError from "./ApplicationError";

export default class ServerError extends ApplicationError {
    constructor(message, details?) {
        super(message || "An error occurred. Please try again.", 500, details)
    }
}