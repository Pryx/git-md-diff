import fs from 'fs';

// TODO: Separate prod and dev configs
const rawdata = fs.readFileSync('config/config.prod.json');
const staticConfig = JSON.parse(rawdata);

const config = {
  app: {
    port: parseInt(process.env.PORT, 10) || staticConfig.app.port,
  },
};

export default config;
