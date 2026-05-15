var express = require('express');
var api = require('../headscale-api');

var router = express.Router();

router.get('/', function(req, res) {
  api.listUsers(function(err, users) {
    if (err) {
      return res.render('preauth', {
        title: 'Pre-Auth Keys',
        users: [],
        keys: [],
        defaultUser: '',
        defaultUserId: '',
        error: err.message,
        success: null,
      });
    }

    users = users || [];

    // Pre-select user from ?user= param (e.g. when linked from Devices table)
    var defaultUser   = req.query.user || (users.length > 0 ? users[0].name : '');
    var defaultUserObj = users.find(function(u) { return u.name === defaultUser; }) || users[0];
    var defaultUserId = defaultUserObj ? defaultUserObj.id : '';

    if (users.length === 0) {
      return res.render('preauth', {
        title: 'Pre-Auth Keys',
        users: [],
        keys: [],
        defaultUser: '',
        defaultUserId: '',
        error: req.query.error || null,
        success: req.query.success || null,
      });
    }

    // Fetch all keys in a single call — the API ignores ?user= and returns
    // everything anyway; each key has an embedded user object we can read.
    api.listAllPreAuthKeys(function(keyErr, keys) {
      var allKeys = [];
      if (!keyErr && keys) {
        keys.forEach(function(k) {
          // Headscale embeds the user object on each key
          var userName = (k.user && (k.user.name || k.user.displayName)) || '';
          var userId   = (k.user && k.user.id) || '';
          allKeys.push(Object.assign({}, k, { userName: userName, userId: userId }));
        });
      }
      // Sort newest expiration first
      allKeys.sort(function(a, b) {
        return new Date(b.expiration || 0) - new Date(a.expiration || 0);
      });
      res.render('preauth', {
        title: 'Pre-Auth Keys',
        users: users,
        keys: allKeys,
        defaultUser: defaultUser,
        defaultUserId: defaultUserId,
        error: keyErr ? keyErr.message : (req.query.error || null),
        success: req.query.success || null,
      });
    });
  });
});

router.post('/create', function(req, res) {
  var user   = req.body.user;    // name, used for redirect
  var userId = req.body.userId;  // numeric ID, used for API
  var hours = parseInt(req.body.expiry_hours, 10) || 1;
  var expiration = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  api.createPreAuthKey(userId, {
    reusable:   req.body.reusable  === 'on',
    ephemeral:  req.body.ephemeral === 'on',
    expiration: expiration,
  }, function(err) {
    if (err) return res.redirect('/preauth?user=' + encodeURIComponent(user) + '&error=' + encodeURIComponent(err.message));
    res.redirect('/preauth?user=' + encodeURIComponent(user) + '&success=Pre-auth key created.');
  });
});

router.post('/expire', function(req, res) {
  api.expirePreAuthKey(req.body.user, req.body.key, function(err) {
    if (err) return res.redirect('/preauth?error=' + encodeURIComponent(err.message));
    res.redirect('/preauth?success=Key expired.');
  });
});

module.exports = router;
