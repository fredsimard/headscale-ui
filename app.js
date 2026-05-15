require('dotenv').config();

var express = require('express');
var session = require('express-session');
var path = require('path');

var api = require('./headscale-api');
var authMiddleware = require('./middleware/auth');
var authRoutes = require('./routes/auth');
var devicesRoutes = require('./routes/devices');
var usersRoutes = require('./routes/users');
var preauthRoutes = require('./routes/preauth');
var prefsRoutes = require('./routes/prefs');

var SERVER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

var DATE_STYLES = {
  long:   { dateStyle: 'long',   timeStyle: 'medium' },
  medium: { dateStyle: 'medium', timeStyle: 'short'  },
  short:  { dateStyle: 'short',  timeStyle: 'short'  },
};

function relativeDate(d) {
  var diff     = Date.now() - d.getTime();
  var secs     = Math.floor(diff / 1000);
  var mins     = Math.floor(secs / 60);
  var hours    = Math.floor(mins / 60);
  var days     = Math.floor(hours / 24);
  var weeks    = Math.floor(days / 7);
  var months   = Math.floor(days / 30.44);
  var years    = Math.floor(days / 365.25);

  function p(n, w) { return n + ' ' + w + (n === 1 ? '' : 's') + ' ago'; }

  if (mins  < 1)  return 'just now';
  if (hours < 1)  return p(mins, 'minute');
  if (days  < 1)  {
    var remMins = mins % 60;
    return remMins > 0 ? p(hours, 'hour') + ' and ' + p(remMins, 'minute') : p(hours, 'hour');
  }
  if (days  < 7)  {
    var remHours = hours % 24;
    return remHours > 0 ? p(days, 'day') + ' and ' + p(remHours, 'hour') : p(days, 'day');
  }
  // ≥ 1 week — no time detail
  if (years  >= 1) return p(years,  'year');
  if (months >= 1) return p(months, 'month');
  return p(weeks, 'week');
}

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
  var prefs = req.session.prefs || {};
  var tz    = prefs.timezone || SERVER_TZ;
  var style = DATE_STYLES[prefs.dateFormat] || DATE_STYLES.medium;
  var opts  = Object.assign({}, style, { hour12: prefs.timeFormat !== '24h', timeZone: tz });

  res.locals.path  = req.path;
  res.locals.user  = req.session.user || null;
  res.locals.tz    = tz;
  res.locals.theme = prefs.theme || 'light';

  res.locals.formatDate = function(val) {
    if (!val) return '—';
    var d = new Date(val);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return '—';
    if (prefs.dateFormat === 'relative') return relativeDate(d);
    return d.toLocaleString(undefined, opts);
  };

  // Fetch policy status for the footer badge — only when logged in
  if (!req.session || !req.session.user) return next();
  api.getPolicy(function(err, data) {
    res.locals.policyActive = !err && data && typeof data.policy === 'string' && data.policy.trim().length > 0;
    next();
  });
});

app.use('/', authRoutes);

app.use(authMiddleware);

app.get('/', function(req, res) { res.redirect('/devices'); });
app.use('/devices', devicesRoutes);
app.use('/users', usersRoutes);
app.use('/preauth', preauthRoutes);
app.use('/prefs', prefsRoutes);

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
