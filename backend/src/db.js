// db.js
const postgres = require('postgres');

// TODO: Load from config!
const sql = postgres({
  host: 'db', // Postgres ip address or domain name
  port: 5432, // Postgres server port
  database: 'postgres', // Name of database to connect to
  username: 'postgres', // Username of database user
  password: 'postgres', // Password of database user
  ssl: false, // True, or options for tls.connect
  max: 10, // Max number of connections
  idle_timeout: 0, // Idle connection timeout in seconds
  connect_timeout: 30, // Connect timeout in seconds
});

async function setupDb() {
  //await sql`DROP TABLE IF EXISTS documentations;`;

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

module.exports = sql;
