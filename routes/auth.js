var express = require('express');
var bcrypt = require('bcryptjs');

var router = express.Router();

// Simple in-memory rate limiter for login
var loginAttempts = {};
var WINDOW_MS = 15 * 60 * 1000;
var MAX_ATTEMPTS = 10;

function loginLimiter(req, res, next) {
  var ip = req.ip || req.connection.remoteAddress;
  var now = Date.now();

  if (!loginAttempts[ip] || loginAttempts[ip].resetAt < now) {
    loginAttempts[ip] = { count: 0, resetAt: now + WINDOW_MS };
  }

  loginAttempts[ip].count++;

  if (loginAttempts[ip].count > MAX_ATTEMPTS) {
    return res.status(429).render('login', {
      title: 'Login',
      error: 'Too many login attempts. Try again in 15 minutes.',
    });
  }
  next();
}

router.get('/login', function(req, res) {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: 'Login', error: null });
});

router.post('/login', loginLimiter, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var adminUser = process.env.ADMIN_USERNAME || 'admin';
  var adminHash = process.env.ADMIN_PASSWORD_HASH || '';

  if (!adminHash) {
    return res.render('login', {
      title: 'Login',
      error: 'Admin password not configured. Set ADMIN_PASSWORD_HASH in .env',
    });
  }

  if (username !== adminUser) {
    return res.render('login', { title: 'Login', error: 'Invalid credentials.' });
  }

  bcrypt.compare(password, adminHash, function(err, valid) {
    if (err || !valid) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials.' });
    }

    req.session.regenerate(function(err) {
      if (err) {
        return res.render('login', { title: 'Login', error: 'Session error.' });
      }
      req.session.user = { username: adminUser };
      req.session.save(function() { res.redirect('/'); });
    });
  });
});

router.post('/logout', function(req, res) {
  req.session.destroy(function() { res.redirect('/login'); });
});

module.exports = router;
