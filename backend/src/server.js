import express from 'express';
import passport from 'passport';
import GitLabStrategy from 'passport-gitlab2';

const FileType = require('file-type');

const simpleGit = require('simple-git');

const app = express();

const cors = require('cors');

app.use(cors());
app.use(express.json());
const fs = require('fs');

let rawdata = fs.readFileSync('./gitlab_credentials.json');
let gitlab = JSON.parse(rawdata);

passport.use(new GitLabStrategy({
  clientID: gitlab.appid,
  clientSecret: gitlab.secret,
  callbackURL: "http://localhost:3000/auth/gitlab/callback"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({gitlabId: profile.id}, function (err, user) {
    return cb(err, user);
  });
}
));


const getDirectories = (source) => fs.readdirSync(source, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

app.get('/', (req, res) => {
  res.send('Please use endpoints documented in the OpenAPI file');
});

// Clones the repository to local storage
app.post('/clone', (req, res) => {
  const { url } = req.body;
  const git = simpleGit();
  const name = url.split('/').pop().replace('.git', '');
  fs.mkdirSync(`./repositories/${name}`, { recursive: true });

  // Clone the files
  git.clone(url, `./repositories/${name}`).then(() => {
    const ngit = simpleGit(`./repositories/${name}`, { maxConcurrentProcesses: 1 });

    const promises = [];

    //Checkout files
    ngit.branch().then((branches) => {

      // Checkout all branches
      branches.all.forEach((elem) => {
        const last = elem.split('/').pop();
        promises.push(ngit.checkout(last));
      });

      // Only success if all branches checked out
      Promise.all(promises).then(() => {
        res.send({ name, success: true });
      });
    });
  }).catch((e) => res.send({ success: false, error: e }));
});

// Save file and commit to git
app.post('/save', (req, res) => {
  const {
    repo, file, commit, content,
  } = req.body;
  const git = simpleGit(`./repositories/${repo}`);

  // For hasging the branch name
  const hash = require('crypto')
    .createHash('sha256')
    .update(file + content)
    .digest('hex');

  const branch = `git_md_diff_${hash}`;

  // Create branch
  git.branch([branch, commit]).then(() => {
    git.checkout(branch).then(() => {
      // Update file
      fs.writeFile(`./repositories/${repo}/${file}`, content, (err) => {
        if (err) {
          res.send({ success: false, error: err, phase: 'write' });
          return;
        }

        // Add file and commit the changes
        git.add(`${file}`).then(() => {
          git.commit(`Edited file ${file} via git-md-diff`).then(() => {
            res.send({ success: true });
          }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'commit' }));
        }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'add' }));
      });
    }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'checkout' }));
  }).catch((e) => res.send({ success: false, error: JSON.stringify(e), phase: 'branch' }));
});

// Get repos
app.get('/list-repos', (req, res) => {
  let list = [];
  if (fs.existsSync('./repositories/')) {
    list = getDirectories('./repositories/');
  }
  res.send(list);
});

// Get branches from repo
app.get('/:repo/get-branches', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);
  git.branchLocal().then((branches) => res.send(branches));
});

// Get commits from branches
app.get('/:repo/get-commits/:branch', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);

  // Not sure why this wouldn't work with the default implementation...
  git.log([`${req.params.branch}`]).then((history) => res.send(history));
});

// File change list
app.get('/:repo/list-changes/:from/:to', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);
  git.diffSummary([`${req.params.from}...${req.params.to}`, '--diff-filter=d']).then((changes) => {
    //Todo: More robust file filtering
    const fileChanges = changes.files.filter((change) => change.file.includes('.md'));

    res.send(fileChanges);
  });
});

// Text file
app.get('/:repo/file/:file/:commit', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);

  git.show([`${req.params.commit}:${req.params.file}`]).then((file) => {
    res.send({ content: file });
  }).catch(() => res.send({ content: '' }));
});

// Blob file
app.get('/:repo/file/:file/:commit/raw', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.repo}`);

  // This does not work - the problem is that if there is a 0, it is parsed as null
  // terminator and the file is then incomplete...
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


app.get('/auth/gitlab', passport.authenticate('gitlab'));

app.get('/auth/gitlab/callback',
  passport.authenticate('gitlab', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

export default app;
