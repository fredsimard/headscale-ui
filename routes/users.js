var express = require('express');
var api = require('../headscale-api');

var router = express.Router();

router.get('/', function(req, res) {
  api.listUsers(function(err, users) {
    if (err || !users || users.length === 0) {
      return res.render('users', {
        title: 'Users',
        users: users || [],
        keyCounts: {},
        error: err ? err.message : (req.query.error || null),
        success: req.query.success || null,
      });
    }

    // Fetch pre-auth key counts for all users in parallel
    var keyCounts = {};
    var pending = users.length;

    users.forEach(function(u) {
      api.listPreAuthKeys(u.name, function(keyErr, keys) {
        keyCounts[u.name] = keyErr ? 0 : (keys || []).length;
        if (--pending === 0) {
          res.render('users', {
            title: 'Users',
            users: users,
            keyCounts: keyCounts,
            error: req.query.error || null,
            success: req.query.success || null,
          });
        }
      });
    });
  });
});

router.post('/create', function(req, res) {
  api.createUser(req.body.name, function(err) {
    if (err) return res.redirect('/users?error=' + encodeURIComponent(err.message));
    res.redirect('/users?success=User created.');
  });
});

router.post('/rename', function(req, res) {
  api.renameUser(req.body.id, req.body.newName, function(err) {
    if (err) return res.redirect('/users?error=' + encodeURIComponent(err.message));
    res.redirect('/users?success=' + encodeURIComponent('User renamed to ' + req.body.newName + '.'));
  });
});

router.post('/delete', function(req, res) {
  api.deleteUser(req.body.id, function(err) {
    if (err) return res.redirect('/users?error=' + encodeURIComponent(err.message));
    res.redirect('/users?success=User deleted.');
  });
});

module.exports = router;
