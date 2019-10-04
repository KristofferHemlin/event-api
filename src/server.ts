import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as csp from 'helmet-csp';

import { createConnection } from 'typeorm';

import * as multer from 'multer';

import setUpUserRoutes from './routes/user.routes';
import setUpCompanyRoutes from './routes/company.routes';
import setUpAuthenticationRoutes from './routes/authentication.routes';
import setUpEventRoutes from './routes/event.routes';
import setUpActivityRoutes from './routes/activity.routes';

import "reflect-metadata";

// Sets up express application!
const app = express();



// Sets up express dependencies.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(csp({
  directives: {
    imgSrc: [`'self'`]
  }
}))

// test middleware -- remove later
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Methods', "POST, GET, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, OPTIONS, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// sets up an accessable public folder. 
app.use(express.static('public'));

// Sets up typeorm connection.
createConnection().then(connection => {
  console.log('Connection to database established!');

  // Sets up the imported routes.
  setUpUserRoutes(app);
  setUpCompanyRoutes(app);
  setUpAuthenticationRoutes(app);
  setUpEventRoutes(app);
  setUpActivityRoutes(app);

  app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello World!');
  })

  app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port: ${process.env.PORT}.`);
  });

}).catch(error => console.log(error));
