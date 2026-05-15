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

    // Fetch keys for all users in parallel, tag each key with its owner
    var allKeys = [];
    var pending = users.length;

    users.forEach(function(u) {
      api.listPreAuthKeys(u.name, function(keyErr, keys) {
        if (!keyErr && keys) {
          keys.forEach(function(k) {
            allKeys.push(Object.assign({}, k, { userName: u.name, userId: u.id }));
          });
        }
        if (--pending === 0) {
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
            error: req.query.error || null,
            success: req.query.success || null,
          });
        }
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
