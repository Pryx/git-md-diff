import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import mime from 'mime-types';
import passport from 'passport';
import GitLabStrategy from 'passport-gitlab2';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import config from './config';
import User from './entities/user';
import Auth from './services/auth';
import DocumentationService from './services/documentation';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Passport!  Also use passport.session() middleware, to support
app.use(passport.initialize());
// #region User auth
const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  // Telling Passport where to find the secret
  secretOrKey: config.app.jwtSecret,
  passReqToCallback: true,
};

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((u, done) => {
  User.getById(u).then((user) => {
    // Get first user matching email
    done(null, user);
  });
});

passport.use(new JwtStrategy(jwtOptions, ((req, jwtPayload, done) => {
  User.getById(jwtPayload.id).then((user) => {
    if (user) {
      return done(null, user);
    }

    return done(null, false);
  });
})));

passport.use(new GitLabStrategy({
  clientID: config.gitlab.appid,
  clientSecret: config.gitlab.secret,
  callbackURL: config.gitlab.callback,
}, ((accessToken, refreshToken, profile, done) => {
  Auth.findOrCreateUser(profile, accessToken, refreshToken, 'gitlab').then((usr) => done(null, usr.id));
})));

app.get('/auth/gitlab', passport.authenticate('gitlab', { scope: ['api'] }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 30, // start blocking after 5 requests
  message:
    'Too many login attempts in 1 minute. Please try again later.',
});

app.get('/auth/gitlab/callback', limiter,
  (req, res, next) => passport.authenticate('gitlab', (err, user, info) => {
    if (err) {
      console.error('GITLAB LOGIN ERROR:', info);
      next(err);
      return;
    }

    if (!user) {
      res.redirect('/login/error');
      return;
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        res.redirect('/login/error');
        console.error('REQ LOGIN ERROR:', loginErr);
        return;
      }

      const accessToken = jwt.sign({ id: user }, config.app.jwtSecret, { expiresIn: '30m' });
      const refreshToken = jwt.sign({ id: user }, config.app.refreshSecret, { expiresIn: '1d' });

      res.redirect(`${config.gitlab.authRedirect}/login/success/${encodeURIComponent(accessToken)}/${encodeURIComponent(refreshToken)}`);
    });
  })(req, res, next));

app.get('/auth/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
  req.logout();
  return res.send({ success: true });
});

app.get('/auth/token', limiter, (req, res) => {
  const token = ExtractJwt.fromAuthHeaderWithScheme('JWT')(req);
  jwt.verify(token, config.app.jwtSecret, (err) => {
    if (!err) {
      res.send({ success: true, data: null });
      return;
    }

    const oldRefresh = ExtractJwt.fromHeader('refreshtoken')(req);
    jwt.verify(oldRefresh, config.app.refreshSecret, (oldErr, data) => {
      if (oldErr) {
        res.status(403).send({ success: false, error: 'Refresh token expired!' });
        return;
      }

      const accessToken = jwt.sign({ id: data.id }, config.app.jwtSecret, { expiresIn: '30m' });
      const refreshToken = jwt.sign({ id: data.id }, config.app.refreshSecret, { expiresIn: '1d' });

      // const oldToken = new RefreshToken({});

      res.send({ success: true, data: { token: accessToken, refreshToken } });
    });
  });
});

// #endregion

// #region User info
app.get('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  // req.user is guaranteed to be set by verifyAuth middleware
  if (req.params.id === 'current') {
    res.json({
      success: true,
      user: req.user.getPublic(),
    });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (!Number.isNaN(id)) {
    const user = User.getById(id);
    user.then(
      (u) => res.json({
        success: true,
        user: u.getPublic(),
      }),
    );
  }

  res.status(404).json({ success: false });
});
// #endregion

// #region GIT
// Clones the repository to local storage
app.put('/documentations/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.create(req.body).then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

app.delete('/documentations/:docu', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.remove(req.params.docu, req.body.deleteRepo).then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Save file and commit to git
app.put('/documentations/:docu/pages/:page', passport.authenticate('jwt', { session: false }), (req, res) => {
  // TODO: Fix this
  const service = new DocumentationService(req.user);
  service.savePage().then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get repos
app.get('/documentations', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getList()
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get documentation versions
app.get('/documentations/:docu', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.get(req.params.docu)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get documentation versions
app.delete('/documentations/:docu', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.delete(req.params.docu, req.body)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get documentation versions
app.get('/documentations/provider/:provider', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getRemoteList(req.params.provider)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Search users in selected provider
app.get('/documentations/provider/:provider/users/:search', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getRemoteUserList(req.params.provider, req.params.search)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get documentation versions
app.get('/documentations/:docu/versions', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getVersions(req.params.docu)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get documentation users
app.get('/documentations/:docu/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  DocumentationService.getUsers(req.params.docu)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Remove user by uid
app.put('/documentations/:docu/users/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.addUser(req.params.docu, req.body)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Remove user by uid
app.delete('/documentations/:docu/users/:uid', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.removeUser(req.params.docu, req.params.uid)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Get commits from branches
app.get('/documentations/:docu/:version/revisions', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getRevisions(req.params.docu, req.params.version)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// File change list
app.get('/documentations/:docu/changes/:from/:to', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getChanges(req.params.docu, req.params.from, req.params.to)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

// Text file
app.get('/documentations/:docu/:revision/pages/:page', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getBlob(req.params.docu, req.params.revision, req.params.page)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});

app.get('/documentations/:docu/:revision/files', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getFiles(req.params.docu, req.params.revision)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: error.message }));
});


// Blob file
app.get('/documentations/:docu/:revision/blobs/:blob', passport.authenticate('jwt', { session: false }), (req, res) => {
  const type = mime.lookup(req.params.blob);
  const service = new DocumentationService(req.user);
  service.getBlob(req.params.docu, req.params.revision, req.params.blob)
    .then((data) => res.type(type).send(data))
    .catch((error) => res.status(500).send(error));
});

// Catchall
app.get('*', (req, res) => {
  res.send('API is running. Please use endpoints documented in the OpenAPI file');
});

export default app;
