import ApplicationError from "./ApplicationError";

export default class ResourceNotFoundError extends ApplicationError {
    constructor(message, details?) {
        super(message || "The requested resource was not found", 404, details)
    }
}