const path = require('path');

module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'TrackNGo'),  // use your DB name
      user: env('DATABASE_USERNAME', 'trackngo_user'),  // your DB user
      password: env('DATABASE_PASSWORD', 'Joshna@25'),  // your DB password
      ssl: env.bool('DATABASE_SSL', false),
      schema: env('DATABASE_SCHEMA', 'public'),
    },
    pool: { min: 2, max: 10 },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});
