import fs from 'fs';

// TODO: Separate prod and dev configs
const rawdata = fs.readFileSync('config/config.prod.json');
const staticConfig = JSON.parse(rawdata);

const config = {
  app: {
    port: parseInt(process.env.PORT, 10) || staticConfig.app.port,
    jwtSecret: staticConfig.app.jwtSecret,
    refreshSecret: staticConfig.app.refreshSecret,
  },
  db: {
    host: process.env.DATABASE_HOST || staticConfig.db.host,
    port: process.env.DATABASE_PORT || staticConfig.db.port,
    database: process.env.DATABASE_DATABASE_NAME || staticConfig.db.database,
    username: process.env.DATABASE_USERNAME || staticConfig.db.username,
    password: process.env.DATABASE_PASSWORD || staticConfig.db.password,
    ssl: staticConfig.db.ssl,
  },
  gitlab: {
    appid: staticConfig.gitlab.appid,
    secret: staticConfig.gitlab.secret,
    callback: staticConfig.gitlab.callback,
    authRedirect: staticConfig.gitlab.authRedirect,
    baseUrl: staticConfig.gitlab.baseUrl,
  },
};

export default config;
