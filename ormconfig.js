module.exports = {
   "type": "postgres",
   "host": process.env.DB_HOST,
   "port": process.env.DB_PORT,
   "username": process.env.DB_USERNAME,
   "password": process.env.DB_PASSWORD,
   "database": process.env.DB_DATABASE,
   "synchronize": true,
   "logging": false,
   "entities": [
      process.env.ISDEV === 'true' ?  "src/entities/**/*.ts" : "dist/entities/**/*.js"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "cli": {
      "migrationsDir": "src/migration",
   },
   "subscribers": [
      "src/subscriber/**/*.ts"
   ]
}
// Pls work