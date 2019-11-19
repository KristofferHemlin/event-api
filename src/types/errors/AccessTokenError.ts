import ApplicationError from "./ApplicationError";

export default class AccessTokenError extends ApplicationError {
    constructor(message, details?) {
        super(message || "AccessToken not valid", 401, details)
    }
}