// config.js
const config = {
  app: {
    port: parseInt(process.env.PORT) || 3000,
    jwtSecret: "tokenSecret",
    refreshSecret: "refreshSecret"
  },
  db: {
    host: process.env.DATABASE_HOST || "db",
    port: process.env.DATABASE_PORT || "5432",
    database: process.env.DATABASE_DATABASE_NAME || "postgres",
    username: process.env.DATABASE_USERNAME || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    ssl: false
  },
  gitlab: {
    appid: "---",
    secret: "---",
    callback: "http://localhost:5000/api/auth/gitlab/callback"
  }
};

export default config;