
export default class ApplicationError extends Error {
    status: number;
    details;
    constructor(message, status, details) {
        super();
        Error.captureStackTrace(this, this.constructor);

        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        this.details = details;
    }
}