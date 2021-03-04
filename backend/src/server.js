import express from 'express'
import session from 'express-session'
import passport from 'passport'
import GitLabStrategy from 'passport-gitlab2'
import User from './entities/user'
import sql from './db'
import fs from 'fs'
import FileType from 'file-type'
import simpleGit from 'simple-git'
import cors from 'cors';
import crypto from 'crypto'
import { verifyAuth } from './middleware/auth-verification'

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({ secret: 'rG46ciMNbNKtcWw6Ap6D7NuESADuMuTi', resave: false, saveUninitialized: false }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());


//#region User auth
let rawdata = fs.readFileSync('./gitlab_credentials.json');
let gitlab = JSON.parse(rawdata);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (u, done) {
  User.getByEmail(u).then((user) => {
    let [first] = user;
    done(null, first)
  });
});

passport.use(new GitLabStrategy({
  clientID: gitlab.appid,
  clientSecret: gitlab.secret,
  callbackURL: "http://localhost:5000/api/auth/gitlab/callback"
},
  function (accessToken, refreshToken, profile, cb) {
    let user = User.getByProviderId(profile.id, 'gitlab');
    user.then(u => {
      if (u.count == 0) {
        //Create user
        user = new User({ email: profile.emails[0].value, name: profile.displayName, linked: { gitlab: profile.id }, tokens: { gitlab: { access: accessToken, refresh: refreshToken } } })
        user.save()
        cb(null, user.email);
      }else{
        //Get the first result
        let [usr] = u;
        cb(null, usr.email);
      }
    })
  }
));


app.get('/auth/gitlab', passport.authenticate('gitlab'));

app.get('/auth/gitlab/callback',
  (req, res, next) => passport.authenticate('gitlab', function (err, user, info) {
    if (err) return next(err)
    if (!user) {
      res.redirect("/login/error");//return res.json({ success: false, message: info.message })
    }

    req.login(user, loginErr => {
      if (loginErr) {
        return res.redirect("/login/error")
      }

      return res.redirect("/login/success")
    })
  })(req, res, next)
);


app.get('/auth/logout', verifyAuth, (req, res, next) => {
  req.logout()
	return res.send({success: true});
});

//#endregion

//#region User info
app.get('/users/:id', verifyAuth, (req, res, next) => {
  if (req.params.id == "current"){
    return res.json({
      success: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        }
      }
    )  
  }

  let id = parseInt(req.params.id);
  if (!isNaN(parseInt(req.params.id))){
    let user = User.getById(id);
    user.then(
      (u) => {
        let [usr] = u
        return res.json({
          success: true, 
          user: {
            id: usr.id,
            email: usr.email,
            name: usr.name,
            }
          }
        )
      }
    );
  } else {
    return res.status(404).json({success: false})
  }
});

app.post('/users/current/update', verifyAuth, (req, res, next) => {
  //TODO: Actually update user data

  return res.json({
    success: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      }
    }
  )
});
//#endregion

//#region GIT
const getDirectories = (source) => fs.readdirSync(source, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

// Clones the repository to local storage
app.post('/documentations/create', (req, res) => {
  const { url } = req.body;
  //TODO
});

// Save file and commit to git
app.post('/pages/save', (req, res) => {
  const {
    repo, file, commit, content,
  } = req.body;
  const git = simpleGit(`./repositories/${repo}`);

  // For hasging the branch name
  const hash = crypto
    .createHash('sha256')
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
app.get('/documentations', (req, res) => {
  let list = [];
  if (fs.existsSync('./repositories/')) {
    list = getDirectories('./repositories/');
  }
  res.send(list);
});

// Get branches from repo
app.get('/documentations/:docu/versions', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.docu}`);
  git.branchLocal().then((branches) => res.send(branches)).catch((e) => res.send([]));
});

// Get commits from branches
app.get('/documentations/:docu/:version/revisions', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.docu}`);

  // Not sure why this wouldn't work with the default implementation...
  git.log([`${req.params.version}`]).then((history) => res.send(history)).catch((e) => res.send([]));
});

// File change list
app.get('/documentations/:docu/changes/:from/:to', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.docu}`);
  git.diffSummary([`${req.params.from}...${req.params.to}`, '--diff-filter=d']).then((changes) => {
    //Todo: More robust file filtering
    const fileChanges = changes.files.filter((change) => change.file.includes('.md'));

    res.send(fileChanges);
  }).catch((e) => res.send([]));
});

// Text file
app.get('/documentations/:docu/:commit/pages/:page', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.docu}`);

  git.show([`${req.params.commit}:${req.params.page}`]).then((page) => {
    res.send({ content: page });
  }).catch(() => res.send({ content: '' }));
});

// Blob file
app.get('/documentations/:docu/blob/:file/:commit', (req, res) => {
  const git = simpleGit(`./repositories/${req.params.docu}`);

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
//#endregion

// Catchall
app.get('*', (req, res) => {
  res.status(404).send('Please use endpoints documented in the OpenAPI file');
});


export default app;