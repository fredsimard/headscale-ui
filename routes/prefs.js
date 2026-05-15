var express = require('express');
var prefsStore = require('../prefs-store');

var router = express.Router();

var SERVER_TZ   = 'America/Toronto';
var ALL_TZ      = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [SERVER_TZ];
var TIME_FORMATS = ['12h', '24h'];
var DATE_FORMATS = ['long', 'medium', 'short', 'relative'];

router.get('/', function(req, res) {
  var prefs = prefsStore.getAll();
  res.render('prefs', {
    title:          'Preferences',
    serverTz:       SERVER_TZ,
    allTimezones:   ALL_TZ,
    currentTz:      prefs.timezone      || SERVER_TZ,
    timeFormat:     prefs.timeFormat    || '12h',
    dateFormat:     prefs.dateFormat    || 'medium',
    headscaleFqdn:  prefs.headscaleFqdn || '',
    success: req.query.success || null,
    error:   null,
  });
});

router.post('/', function(req, res) {
  var updates = {};
  var tz = req.body.timezone;
  if (tz && ALL_TZ.includes(tz))                    updates.timezone   = tz;
  if (TIME_FORMATS.includes(req.body.timeFormat))   updates.timeFormat = req.body.timeFormat;
  if (DATE_FORMATS.includes(req.body.dateFormat))   updates.dateFormat = req.body.dateFormat;
  var fqdn = (req.body.headscaleFqdn || '').trim();
  updates.headscaleFqdn = fqdn;
  prefsStore.merge(updates);
  res.redirect('/prefs?success=' + encodeURIComponent('Preferences saved.'));
});

// AJAX theme toggle — called by the dark mode button without a page reload
router.post('/theme', function(req, res) {
  var theme = req.body.theme;
  if (theme === 'dark' || theme === 'light') {
    prefsStore.set('theme', theme);
  }
  res.json({ ok: true, theme: prefsStore.get('theme') });
});

module.exports = router;
