import ApplicationError from "./ApplicationError";

export default class ForbiddenAccessError extends ApplicationError {
    constructor(message, details?) {
        super(message || "Forbidden access", 403, details)
    }
}