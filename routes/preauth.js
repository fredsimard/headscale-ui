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
        selectedUser: '',
        error: err.message,
        success: null,
      });
    }

    users = users || [];
    var selectedUser = req.query.user || (users.length > 0 ? users[0].name : '');

    if (!selectedUser) {
      return res.render('preauth', {
        title: 'Pre-Auth Keys',
        users: users,
        keys: [],
        selectedUser: '',
        error: req.query.error || null,
        success: req.query.success || null,
      });
    }

    api.listPreAuthKeys(selectedUser, function(keyErr, keys) {
      res.render('preauth', {
        title: 'Pre-Auth Keys',
        users: users,
        keys: keys || [],
        selectedUser: selectedUser,
        error: keyErr ? keyErr.message : (req.query.error || null),
        success: req.query.success || null,
      });
    });
  });
});

router.post('/create', function(req, res) {
  var user = req.body.user;
  var hours = parseInt(req.body.expiry_hours, 10) || 1;
  var expiration = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  api.createPreAuthKey(user, {
    reusable: req.body.reusable === 'on',
    ephemeral: req.body.ephemeral === 'on',
    expiration: expiration,
  }, function(err) {
    if (err) return res.redirect('/preauth?user=' + encodeURIComponent(user) + '&error=' + encodeURIComponent(err.message));
    res.redirect('/preauth?user=' + encodeURIComponent(user) + '&success=Pre-auth key created.');
  });
});

router.post('/expire', function(req, res) {
  var user = req.body.user;
  api.expirePreAuthKey(user, req.body.key, function(err) {
    if (err) return res.redirect('/preauth?user=' + encodeURIComponent(user) + '&error=' + encodeURIComponent(err.message));
    res.redirect('/preauth?user=' + encodeURIComponent(user) + '&success=Key expired.');
  });
});

module.exports = router;
