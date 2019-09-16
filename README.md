# Event-app REST API  

This is the repository for the REST API, that is used to power the
Claremont Event-app.

## Dependencies

* Git-CLI - https://git-scm.com/downloads
* NodeJS (with NPM) - https://nodejs.org/en/
* PostgreSQL
  * (MAC) Install by Homebrew - https://brew.sh/index_sv
    * ...then type: `brew install postgresql` in the terminal.
  * (Windows)(untested) install by program. - https://www.postgresql.org/download/windows/  

## Stack / Structure

* NodeJS
* Express
* TypeORM
* PostgreSQL

## Installation

  ### 1. Clone down the repository
  Start by cloning down the repository, by copying the following code and
  pasting it in your terminal at the location you want to place the local
  repository.

  `git clone git@github.com:Zyntox/event-api.git`

  ### 2. Install Dependencies
  Navigate into the repository.

  `cd event-api`

<<<<<<< HEAD
  ... then while standing in the root folder, type in the following:

  `npm install`

  ### 3. Create config files.
  Open up the Microsoft Teams application.
  From the group "Eventapp" locate the files tab and download the following files from the `api-relaterat` folder:

  ```
  ormconfig.json
  jwtConfig.ts
  .env
  ```

  Then place the files in the root folder of the "event-api" repository.

  ### 4. Set up a local PostgreSQL database.
  W.I.P
=======
  ... then while standing in the root folder, type in the following.

  `npm install`

* Create a ".env" file.
* Create an "ormconfig.json" file.
* Create a "jwtConfig.ts" file.
>>>>>>> b9841de7c1bd4cb16d15db400bf61f38b5df8ee1

## To-dos

### General
- [ ] \(Re-activate) Lock-down routes that needs authentication.
- [x] Set up guards for if someone tries to add a user to an Event, when the user is not an employee of the parent company.
- [x] Set up guards for if someone tries to add a user to an activity, when the user is not a participant of the parent event.
- [x] Update the activity routes to include reference to company.
- [ ] Install "TypeORM Seeding" to add seeding functionality. (Used for ROLES and PERMISSIONS)
- [ ] Set up ROLES for USERS.
- [ ] Set up PERMISSION for ROLES.
- [ ] Functionality for uploading of images. (profile photos, event images)
- [x] Add company id to the JWT-token signing.
- [ ] Add user role to the JWT-token signing.
- [ ] Add correct error status messages.
- [x] Fix filter functionality on remove user-from-event-route.
- [ ] Make activites the option to be self-joinable (a user can choose to join one.).

### Routes
- [x] Set up DELETE route for events.
- [x] Set up DELETE route for activities.
- [ ] Set up DELETE route for removing a user from an activity.
- [ ] Set up route resetting passwords.
- [ ] Set up forgotten password route resetting passwords.  
