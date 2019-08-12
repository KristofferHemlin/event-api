import * as express from 'express';
import * as bodyParser from 'body-parser';
import { createConnection } from 'typeorm';

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

// test middleware -- remove later
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*'); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


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
