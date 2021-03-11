import http from 'http';
import app from './server';

const port = process.env.PORT || 4000;
const server = http.createServer(app);

let currentApp = app;

server.listen(port, () => {
  process.stdout.write(`Running on :${port}\n`);
});

// Allow hotswapping the server when code changes
if (module.hot) {
  module.hot.accept('./server', () => {
    server.removeListener('request', currentApp);
    server.on('request', app);
    currentApp = app;
  });
}
