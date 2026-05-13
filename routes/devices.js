var express = require('express');
var api = require('../headscale-api');

var router = express.Router();

router.get('/', function(req, res) {
  api.listNodes(function(nodeErr, nodes) {
    api.listUsers(function(userErr, users) {
      var error = nodeErr ? nodeErr.message : (userErr ? userErr.message : (req.query.error || null));
      res.render('devices', {
        title: 'Devices',
        nodes: nodes || [],
        users: users || [],
        error: error,
        success: req.query.success || null,
      });
    });
  });
});

router.post('/rename', function(req, res) {
  api.renameNode(req.body.nodeId, req.body.newName, function(err) {
    if (err) return res.redirect('/devices?error=' + encodeURIComponent(err.message));
    res.redirect('/devices?success=Device renamed.');
  });
});

router.post('/delete', function(req, res) {
  api.deleteNode(req.body.nodeId, function(err) {
    if (err) return res.redirect('/devices?error=' + encodeURIComponent(err.message));
    res.redirect('/devices?success=Device deleted.');
  });
});

router.post('/register', function(req, res) {
  api.registerNode(req.body.user, req.body.key, function(err) {
    if (err) return res.redirect('/devices?error=' + encodeURIComponent(err.message));
    res.redirect('/devices?success=Device registered.');
  });
});

module.exports = router;
