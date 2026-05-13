require('dotenv').config();

var express = require('express');
var session = require('express-session');
var path = require('path');

var authMiddleware = require('./middleware/auth');
var authRoutes = require('./routes/auth');
var devicesRoutes = require('./routes/devices');
var usersRoutes = require('./routes/users');
var preauthRoutes = require('./routes/preauth');

var app = express();
var PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; " +
    "script-src 'self' https://cdn.jsdelivr.net; " +
    "font-src 'self' https://cdn.jsdelivr.net"
  );
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
}));

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(function locals(req, res, next) {
  res.locals.path = req.path;
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', authRoutes);

app.use(authMiddleware);

app.get('/', function(req, res) { res.redirect('/devices'); });
app.use('/devices', devicesRoutes);
app.use('/users', usersRoutes);
app.use('/preauth', preauthRoutes);

app.use(function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);
  res.status(500).render('error', {
    title: 'Error',
    message: 'An unexpected error occurred.',
  });
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('Headscale UI running on http://0.0.0.0:' + PORT);
});
