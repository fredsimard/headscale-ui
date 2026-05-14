var express = require('express');
var router = express.Router();

var SERVER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
var ALL_TZ = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [SERVER_TZ];

router.get('/', function(req, res) {
  res.render('prefs', {
    title: 'Preferences',
    serverTz: SERVER_TZ,
    allTimezones: ALL_TZ,
    currentTz: (req.session.prefs && req.session.prefs.timezone) || SERVER_TZ,
    success: req.query.success || null,
    error: null,
  });
});

router.post('/', function(req, res) {
  var tz = req.body.timezone;
  if (tz && ALL_TZ.includes(tz)) {
    if (!req.session.prefs) req.session.prefs = {};
    req.session.prefs.timezone = tz;
  }
  res.redirect('/prefs?success=' + encodeURIComponent('Preferences saved.'));
});

module.exports = router;
