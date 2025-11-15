module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', '127.0.0.1'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'TrackNGo'),
      user: env('DATABASE_USERNAME', 'trackngo_user'),
      password: env('DATABASE_PASSWORD', 'Joshna@25'),
      ssl: false,
    },
    debug: false,
  },
});
