// db.js
const postgres = require('postgres')

//TODO: Load from config!
const sql = postgres({
  host            : 'db',         // Postgres ip address or domain name
  port            : 5432,       // Postgres server port
  database        : 'postgres',         // Name of database to connect to
  username        : 'postgres',         // Username of database user
  password        : 'postgres',         // Password of database user
  ssl             : false,      // True, or options for tls.connect
  max             : 10,         // Max number of connections
  idle_timeout    : 0,          // Idle connection timeout in seconds
  connect_timeout : 30,         // Connect timeout in seconds
  }
); 

async function setup_example_db() {
  await sql`DROP TABLE IF EXISTS users;`

  await sql`CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    linked jsonb,
    tokens jsonb
  );`;

  console.log(await sql`SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;`
  );
}

setup_example_db();

module.exports = sql