import express from 'express';
import session from 'express-session';
import passport from 'passport';
import GitLabStrategy from 'passport-gitlab2';
import fs from 'fs';
import cors from 'cors';
import User from './entities/user';
import verifyAuth from './middleware/auth-verification';
import { findOrCreateUser } from './services/auth';
import DocumentationService from './services/documentation'
import mime from 'mime-types'
import rateLimit from 'express-rate-limit'

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({ secret: 'rG46ciMNbNKtcWw6Ap6D7NuESADuMuTi', resave: false, saveUninitialized: false }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// #region User auth
const rawdata = fs.readFileSync('./gitlab_credentials.json');
const gitlab = JSON.parse(rawdata);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((u, done) => {
  User.getByEmail(u).then((user) => {
    //Get first user matching email
    done(null, user);
  });
});

passport.use(new GitLabStrategy({
  clientID: gitlab.appid,
  clientSecret: gitlab.secret,
  callbackURL: 'http://localhost:5000/api/auth/gitlab/callback',
}, ((accessToken, refreshToken, profile, cb) => {
  findOrCreateUser(profile, accessToken, refreshToken).then((usr) => cb(null, usr.email))
})));

app.get('/auth/gitlab', passport.authenticate('gitlab', { scope: ['api'] }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // start blocking after 5 requests
  message:
    "Too many login attempts in 1 minute. Please try again later."
});

app.get('/auth/gitlab/callback', limiter,
  (req, res, next) => passport.authenticate('gitlab', (err, user, info) => {
    if (err) {
      next(err);
      return;
    }

    if (!user) {
      res.redirect('/login/error');// return res.json({ success: false, message: info.message })
      return;
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        res.redirect('/login/error');
        console.error(loginErr);
        return;
      }

      res.redirect('/login/success');
    });
  })(req, res, next));

app.get('/auth/logout', verifyAuth, (req, res) => {
  req.logout();
  return res.send({ success: true });
});

// #endregion

// #region User info
app.get('/users/:id', verifyAuth, (req, res) => {
  //req.user is guaranteed to be set by verifyAuth middleware
  if (req.params.id === 'current') {
    res.json({
      success: true,
      user: req.user.getPublic(),
    });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (!id.isNaN()) {
    const user = User.getById(id);
    user.then(
      (u) => {
        return res.json({
          success: true,
          user: u.getPublic(),
        });
      },
    );
  } else {
    return res.status(404).json({ success: false });
  }
});

app.post('/users/current/update', verifyAuth, (req, res) =>
  // TODO: Actually update user data

  res.json({
    success: true,
    user: req.user.getPublic(),
  }));
// #endregion

// #region GIT
// Clones the repository to local storage
app.post('/documentations/create', (req, res) => {
  const service = new DocumentationService(req.user);
  service.create(req.body).then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});

// Save file and commit to git
app.post('/pages/save', (req, res) => {
  //TODO: Fix this
  //const service = new DocumentationService(req.user);
  //service.savePage();
});

// Get repos
app.get('/documentations', verifyAuth, (req, res) => {
  const service = new DocumentationService(req.user);
  service.getList()
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get documentation versions
app.get('/documentations/:docu', (req, res) => {
  const service = new DocumentationService(req.user);
  service.get(req.params.docu)
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});


// Get documentation versions
app.get('/documentations/provider/:provider', (req, res) => {
  const service = new DocumentationService(req.user);
  service.getProviderList(req.params.provider)
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});

// Get documentation versions
app.get('/documentations/:docu/versions', (req, res) => {
  const service = new DocumentationService(req.user);
  service.getVersions(req.params.docu)
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});

// Get commits from branches
app.get('/documentations/:docu/:version/revisions', (req, res) => {
  const service = new DocumentationService(req.user);
  service.getRevisions(req.params.docu, req.params.version)
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});

// File change list
app.get('/documentations/:docu/changes/:from/:to', (req, res) => {
  const service = new DocumentationService(req.user);
  service.getChanges(req.params.docu, req.params.from, req.params.to)
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});

// Text file
app.get('/documentations/:docu/:revision/pages/:page', (req, res) => {
  const service = new DocumentationService(req.user);
  service.getBlob(req.params.docu, req.params.revision, req.params.page)
    .then((data) => res.send({success: true, data}))
    .catch((error) => res.status(500).send({success: false, error: error.message}));
});

// Blob file
app.get('/documentations/:docu/:revision/blobs/:blob', (req, res) => {
  const type = mime.lookup(req.params.blob);
  const service = new DocumentationService(req.user);
  service.getBlob(req.params.docu, req.params.revision, req.params.blob)
    .then((data) => res.type(type).send(data))
    .catch((error) => res.status(500).send(error) );
});

// Catchall
app.get('*', (req, res) => {
  res.status(404).send('Please use endpoints documented in the OpenAPI file');
});

export default app;
