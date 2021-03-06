import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import mime from 'mime-types';
import passport from 'passport';
import GitLabStrategy from 'passport-gitlab2';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import crypto from 'crypto';
import config from './config';
import User from './entities/user';
import Auth from './services/auth';
import DocumentationService from './services/documentation';
import ProofreadingService from './services/proofreading';
import descriptiveError from './helpers';

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// #region User auth

/**
 * JWT options setup
 */
const jwtOptions = {
  // Telling Passport to check authorization headers for JWT
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  // Telling Passport where to find the secret
  secretOrKey: config.app.jwtSecret,
  passReqToCallback: true,
};

// User serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

// User de-serialization
passport.deserializeUser((u, done) => {
  User.getById(u).then((user) => {
    // Get first user matching email
    done(null, user);
  });
});

// JWT strategy setup
passport.use(new JwtStrategy(jwtOptions, ((req, jwtPayload, done) => {
  User.getById(jwtPayload.id).then((user) => {
    if (user) {
      return done(null, user);
    }

    return done(null, false);
  });
})));

// Gitlab strategy setup
passport.use(new GitLabStrategy({
  clientID: config.gitlab.appid,
  clientSecret: config.gitlab.secret,
  callbackURL: config.gitlab.callback,
  baseURL: config.gitlab.baseUrl,
}, ((accessToken, refreshToken, profile, done) => {
  Auth.findOrCreateUser(profile, accessToken, refreshToken, 'gitlab').then((usr) => done(null, usr.id));
})));

// Gitlab auth endpoint
app.get('/auth/gitlab', passport.authenticate('gitlab', { scope: ['api'] }));

// Rate limiter for login to keep the CodeQL from complaining
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 30, // start blocking after 5 requests
  message:
    'Too many login attempts in 1 minute. Please try again later.',
});

// The Gitlab OAuth callback endpoint, redirects back to frontend
app.get('/auth/gitlab/callback', limiter,
  (req, res, next) => passport.authenticate('gitlab', (err, user, info) => {
    if (err) {
      console.error('GITLAB LOGIN ERROR:', info);
      res.redirect(`${config.gitlab.authRedirect}/login/error`);
      return;
    }

    if (!user) {
      res.redirect(`${config.gitlab.authRedirect}/login/error`);
      return;
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        res.redirect(`${config.gitlab.authRedirect}/login/error`);
        console.error('REQ LOGIN ERROR:', loginErr);
        return;
      }

      const accessToken = jwt.sign({ id: user }, config.app.jwtSecret, { expiresIn: '30m' });
      const refreshToken = jwt.sign({ id: user }, config.app.refreshSecret, { expiresIn: '7d' });

      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const date = new Date();
      date.setDate(date.getDate() + 7);
      Auth.loginUser(user, hash, date.getTime());

      res.redirect(`${config.gitlab.authRedirect}/login/success/${encodeURIComponent(accessToken)}/${encodeURIComponent(refreshToken)}`);
    });
  })(req, res, next));

// Logout
app.get('/auth/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
  const oldRefresh = ExtractJwt.fromHeader('refreshtoken')(req);
  const hash = crypto.createHash('sha256').update(oldRefresh).digest('hex');
  Auth.logoutUser(req.user.id, hash);
  res.send({ success: true });
});

// Generate a new token if expired.
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
      const refreshToken = jwt.sign({ id: data.id }, config.app.refreshSecret, { expiresIn: '7d' });

      const oldHash = crypto.createHash('sha256').update(oldRefresh).digest('hex');
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      Auth.refreshTokenValid(data.id, oldHash).then((valid) => {
        if (!valid) {
          res.status(403).send({ success: false, data: null });
          return;
        }

        Auth.logoutUser(data.id, oldHash);
        const date = new Date();
        date.setDate(date.getDate() + 7);
        Auth.loginUser(data.id, hash, date.getTime());

        res.send({ success: true, data: { token: accessToken, refreshToken } });
      });
    });
  });
});

// #endregion

// #region User info
// Gets user info by ID
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

// #region Documentation endpoints
// Gets all available documentations for the logged in user
app.get('/documentations', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getList()
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Creates a new documentation
app.put('/documentations/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.create(req.body).then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Gets a documentation by ID
app.get('/documentations/:docu', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.get(req.params.docu)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Deletes documentation by ID
app.delete('/documentations/:docu', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.remove(req.params.docu, req.body.deleteRepo)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Get documentation versions
app.get('/documentations/:docu/versions', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getVersions(req.params.docu)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Get commits from branches
app.get('/documentations/:docu/:version/revisions', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getRevisions(req.params.docu, req.params.version)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Saves file and commits it to git
app.put('/documentations/:docu/:version/pages/:page(*)', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.savePage(req.params.docu, req.params.version,
    req.params.page, req.body.content, req.body.commitMessage)
    .then(() => res.send({ success: true }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Gets a text file
app.get('/documentations/:docu/:revision/pages/:page(*)', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getBlob(req.params.docu, req.params.revision, req.params.page)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Deletes file
app.delete('/documentations/:docu/:version/pages/:page(*)', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.deleteFile(req.params.docu, req.params.version,
    req.params.page, req.body.commitMessage)
    .then(() => res.send({ success: true }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// File list - root folder
app.get('/documentations/:docu/:revision/files/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getFiles(req.params.docu, req.params.revision, '/')
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// File list - specified folder
app.get('/documentations/:docu/:revision/files/:path(*)', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getFiles(req.params.docu, req.params.revision, `${req.params.path}`)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// File change list
app.get('/documentations/:docu/changes/:from/:to', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.getChanges(req.params.docu, req.params.from, req.params.to)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Get existing remote documentation
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
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Get documentation users
app.get('/documentations/:docu/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  DocumentationService.getUsers(req.params.docu)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Add user to documentation
app.put('/documentations/:docu/users/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.addUser(req.params.docu, req.body)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Add user to documentation
app.put('/documentations/:docu/users/:uid', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.editUser(req.params.docu, req.body, req.params.uid)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Remove user by uid
app.delete('/documentations/:docu/users/:uid', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new DocumentationService(req.user);
  service.removeUser(req.params.docu, req.params.uid)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Blob file, mainly used for loading images
app.get('/documentations/:docu/:revision/:token/blobs/:blob(*)', (req, res) => {
  let user = null;
  jwt.verify(req.params.token, config.app.jwtSecret, async (err, data) => {
    if (err) {
      res.status(500).send({ error: 'Unauthorized' });
    }

    try {
      user = await User.getById(data.id);
    } catch (error) {
      res.status(500).send({ error });
      return;
    }

    if (!user) {
      res.status(500).send({ error: 'Unauthorized' });
    } else {
      const type = mime.lookup(req.params.blob);
      const service = new DocumentationService(user);
      service.getBlob(req.params.docu, req.params.revision, req.params.blob)
        .then((d) => { res.type(type).send(d); })
        .catch((error) => res.status(500).send({ error }));
    }
  });
});
// #endregion

// #region Proofreading endpoints
// Gets all proofreading requests of a user
app.get('/proofreading/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new ProofreadingService(req.user);
  service.getUserRequests()
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Creates new proofreading request
app.put('/proofreading/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new ProofreadingService(req.user);
  service.create(req.body)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Gets proofreading requests related to a documentation
app.get('/proofreading/documentation/:docuId', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new ProofreadingService(req.user);
  service.getDocuRequests(req.params.docuId)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Gets proofreading request by ID
app.get('/proofreading/:reqId', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new ProofreadingService(req.user);
  service.get(req.params.reqId)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Saves a page edited from a proofreading request, adds the modified file functionality
app.put('/proofreading/:reqId/pages/:page(*)', passport.authenticate('jwt', { session: false }), (req, res) => {
  ProofreadingService.savePage(req.params.reqId, req.params.page)
    .then((data) => res.send({ success: true, data }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Marks proofreading request as complete
app.put('/proofreading/:reqId/submit', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new ProofreadingService(req.user);
  service.finished(req.params.reqId)
    .then(() => res.send({ success: true }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Merges proofreading request
app.put('/proofreading/:reqId/merge', passport.authenticate('jwt', { session: false }), (req, res) => {
  const service = new ProofreadingService(req.user);
  service.merge(req.params.reqId)
    .then(() => res.send({ success: true }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// Rejects proofreading request
app.put('/proofreading/:reqId/reject', passport.authenticate('jwt', { session: false }), (req, res) => {
  ProofreadingService.reject(req.params.reqId)
    .then(() => res.send({ success: true }))
    .catch((error) => res.status(500).send({ success: false, error: descriptiveError(error) }));
});

// #endregion

// Catchall

app.get('/healthz/ready', (req, res) => {
  res.send({ success: true, data: 'Ready' });
});

app.get('/', (req, res) => {
  res.send({ success: true, data: 'Ready' });
});

app.get('*', (req, res) => {
  res.status(404).send({ success: false, error: 'Endpoint not found. For available endpoints, look at the OpenAPI file' });
});

app.put('*', (req, res) => {
  res.status(404).send({ success: false, error: 'Endpoint not found. For available endpoints, look at the OpenAPI file' });
});

app.post('*', (req, res) => {
  res.status(404).send({ success: false, error: 'Endpoint not found. For available endpoints, look at the OpenAPI file' });
});

app.delete('*', (req, res) => {
  res.status(404).send({ success: false, error: 'Endpoint not found. For available endpoints, look at the OpenAPI file' });
});

export default app;
