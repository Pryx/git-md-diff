import express from 'express';

const FileType = require('file-type');

const simpleGit = require('simple-git');

const app = express();

const cors = require('cors');

app.use(cors());
app.use(express.json());

const fs = require('fs');

const getDirectories = (source) => fs.readdirSync(source, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

app.get('/', (req, res) => {
  res.send('Please use endpoints documented in the OpenAPI file');
});

app.post('/clone', (req, res) => {
  const { url } = req.body;
  const git = simpleGit();
  const name = url.split('/').pop().replace('.git', '');
  fs.mkdirSync(`./repositories/${name}`, { recursive: true });
  git.clone(url, `./repositories/${name}`).then(() => {
    const ngit = simpleGit(`./repositories/${name}`, { maxConcurrentProcesses: 1 });

    const promises = [];
    ngit.branch().then((branches) => {
      branches.all.forEach((elem) => {
        const last = elem.split('/').pop();
        promises.push(ngit.checkout(last));
      });

      Promise.all(promises).then(() => {
        res.send({ name, success: true });
      });
    });
  }).catch((e) => res.send({ success: false, error: e }));
});

app.post('/save', (req, res) => {
  const {
    repo, file, commit, content,
  } = req.body;
  const git = simpleGit(`./repositories/${repo}`);

  const hash = require('crypto')
    .createHash('sha256')
    .update(file + content)
    .digest('hex');
  const branch = `git_md_diff_${hash}`;
  git.branch([branch, commit]).then(() => {
    git.checkout(branch).then(() => {
      fs.writeFile(`./repositories/${repo}/${file}`, content,(err) => {
        if (err){
          res.send({ success: false, error: err, phase: 'write'});
          return;
        }
        git.add(`${file}`).then(() => {
          git.commit(`Edited file ${file} via git-md-diff`).then(() => {
            res.send({ success: true });
          }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'commit'}));
        }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'add'}));
      });
    }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'checkout'}));
  }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'branch'}));
});

app.get('/list-repos', (req, res) => {
  let list = [];
  if (fs.existsSync('./repositories/')) {
    list = getDirectories('./repositories/');
  }
  res.send(list);
});

app.get('/:repo/get-branches', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);
  git.branchLocal().then((branches) => res.send(branches));
});

app.get('/:repo/get-commits/:commit', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);

  // Not sure why this wouldn't work with the default implementation...
  git.log([`${req.params.commit}`]).then((history) => res.send(history));
});

app.get('/:repo/list-changes/:from/:to', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);
  git.diffSummary([`${req.params.from}...${req.params.to}`, '--diff-filter=d']).then((changes) => {
    const fileChanges = changes.files.filter((change) => change.file.includes('.md'));

    res.send(fileChanges);
  });
});

app.get('/:repo/file/:file/:commit', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);

  git.show([`${req.params.commit}:${req.params.file}`]).then((file) => {
    res.send({ content: file });
  }).catch(() => res.send({ content: '' }));
});

app.get('/:repo/file/:file/:commit/raw', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);

  git.show([`${req.params.commit}:${req.params.file}`]).then((file) => {
    const bytes = file.length;
    let buf = new Uint8Array(bytes);

    for (let i = 0; i < bytes; i++) {
      buf[i] = file[i];
    }

    buf = Buffer.from(buf);

    FileType.fromBuffer(buf).then((ft) => {
      console.log(ft);
    });

    // res.setHeader('content-type', 'image/png');
    res.send(file);
  }).catch(() => res.send({ content: '' }));
});
export default app;
