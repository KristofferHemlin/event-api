# Event-app REST API  

This is the repository for the REST API, that is used to power the
Claremont Event-app.

## Stack / Structure

* NodeJS
* Express
* TypeORM
* PostgreSQL

## To-dos
- [ ] \(Re-activate) Lock-down routes that needs authentication.
- [ ] Set up guards for if someone tries to add a user to an activity, when the user is not a participant of the parent event.  
- [ ] Install "TypeORM Seeding" to add seeding functionality. (Used for ROLES and PERMISSONS)
- [ ] Set up ROLES for USERS.
- [ ] Set up PERMISSION for ROLES.
- [ ] Set up cascade UPDATE / DELETES for several routes.
- [ ] Functionality for uploading of images. (profile photos, event images)

### Routes
- [ ] Set up DELETE route for activities.

## Installation

This section is yet to be written...

* Create a ".env" file.
* Create an "ormconfig.json" file.
* Create a "jwtConfig.ts" file.
