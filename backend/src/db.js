// db.js
import config from '../config/config.prod';

const postgres = require('postgres');

const sql = postgres({
  host: config.db.host, // Postgres ip address or domain name
  port: config.db.port, // Postgres server port
  database: config.db.database, // Name of database to connect to
  username: config.db.username, // Username of database user
  password: config.db.password, // Password of database user
  ssl: config.db.ssl, // True, or options for tls.connect
  max: 10, // Max number of connections
  idle_timeout: 0, // Idle connection timeout in seconds
  connect_timeout: 30, // Connect timeout in seconds
});

async function setupDb() {
  // await sql`DROP TABLE IF EXISTS documentations;`;

  await sql`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    linked jsonb,
    tokens jsonb
  );`;

  await sql`CREATE TABLE IF NOT EXISTS documentations(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    provider TEXT,
    providerId INTEGER ,
    UNIQUE (provider, providerId)
  );`;

  await sql`CREATE TABLE IF NOT EXISTS roles(
    userId INTEGER REFERENCES users(id),
    docuId INTEGER REFERENCES documentations(id),
    level SMALLINT,
    PRIMARY KEY (userId, docuId)
  );`;

  /*
  console.log(await sql`SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;`);
  */
}

setupDb();

export default sql;
