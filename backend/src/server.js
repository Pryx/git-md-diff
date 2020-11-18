import express from 'express';

const simpleGit = require('simple-git');

const app = express();

const cors = require('cors');

app.use(cors());

app.get('/', (req, res) => {
  res.send('Please use endpoints documented in the OpenAPI file');
});

app.get('/get-branches', (req, res) => {
  const git = simpleGit('/home/pryx/Projekty/codenow-docs-test');
  git.branch().then((branches) => res.send(branches));
});

app.get('/get-commits/:commit', (req, res) => {
  const git = simpleGit('/home/pryx/Projekty/codenow-docs-test');

  // Not sure why this wouldn't work with the default implementation...
  git.log([`${req.params.commit}`]).then((history) => res.send(history));
});

app.get('/list-changes/:from/:to', (req, res) => {
  const git = simpleGit('/home/pryx/Projekty/codenow-docs-test');
  git.diffSummary([`${req.params.from}...${req.params.to}`, '--diff-filter=d']).then((changes) => {
    res.send(changes.files.filter((change) => change.file.includes('.md')));
  });
});

app.get('/file/:file/:commit', (req, res) => {
  const git = simpleGit('/home/pryx/Projekty/codenow-docs-test');

  git.show([`${req.params.commit}:${req.params.file}`]).then((file) => {
    res.send({ content: file });
  }).catch(() => res.send({ content: '' }));
});

export default app;
