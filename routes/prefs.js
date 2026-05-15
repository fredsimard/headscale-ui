var express = require('express');
var router = express.Router();

var SERVER_TZ   = Intl.DateTimeFormat().resolvedOptions().timeZone;
var ALL_TZ      = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [SERVER_TZ];
var TIME_FORMATS = ['12h', '24h'];
var DATE_FORMATS = ['long', 'medium', 'short', 'relative'];

router.get('/', function(req, res) {
  var prefs = req.session.prefs || {};
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
  if (!req.session.prefs) req.session.prefs = {};
  var tz = req.body.timezone;
  if (tz && ALL_TZ.includes(tz))                    req.session.prefs.timezone   = tz;
  if (TIME_FORMATS.includes(req.body.timeFormat))   req.session.prefs.timeFormat = req.body.timeFormat;
  if (DATE_FORMATS.includes(req.body.dateFormat))   req.session.prefs.dateFormat = req.body.dateFormat;
  // Headscale public FQDN (trim whitespace, accept empty to clear)
  var fqdn = (req.body.headscaleFqdn || '').trim();
  req.session.prefs.headscaleFqdn = fqdn;
  res.redirect('/prefs?success=' + encodeURIComponent('Preferences saved.'));
});

// AJAX theme toggle — called by the dark mode button without a page reload
router.post('/theme', function(req, res) {
  if (!req.session.prefs) req.session.prefs = {};
  var theme = req.body.theme;
  if (theme === 'dark' || theme === 'light') {
    req.session.prefs.theme = theme;
  }
  res.json({ ok: true, theme: req.session.prefs.theme });
});

module.exports = router;
