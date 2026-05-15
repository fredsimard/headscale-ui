// Persistent preferences stored as a JSON file on disk.
// Single-admin app so one global prefs object is sufficient.

var fs = require('fs');
var path = require('path');

var PREFS_PATH = process.env.PREFS_PATH || path.join(__dirname, 'data', 'prefs.json');

var DEFAULTS = {
  timezone:      'America/Toronto',
  timeFormat:    '12h',
  dateFormat:    'medium',
  headscaleFqdn: '',
  theme:         'light',
};

var _cache = null;

function ensureDir() {
  var dir = path.dirname(PREFS_PATH);
  try { fs.mkdirSync(dir, { recursive: true }); } catch(e) { /* exists */ }
}

function load() {
  if (_cache) return _cache;
  try {
    var raw = fs.readFileSync(PREFS_PATH, 'utf8');
    _cache = Object.assign({}, DEFAULTS, JSON.parse(raw));
  } catch(e) {
    _cache = Object.assign({}, DEFAULTS);
  }
  return _cache;
}

function save(prefs) {
  _cache = Object.assign({}, DEFAULTS, prefs);
  ensureDir();
  try {
    fs.writeFileSync(PREFS_PATH, JSON.stringify(_cache, null, 2), 'utf8');
  } catch(e) {
    console.error('Failed to write prefs file:', e.message);
  }
  return _cache;
}

function get(key) {
  var p = load();
  return p[key] !== undefined ? p[key] : DEFAULTS[key];
}

function getAll() {
  return load();
}

function set(key, value) {
  var p = load();
  p[key] = value;
  return save(p);
}

function merge(obj) {
  var p = load();
  Object.keys(obj).forEach(function(k) { p[k] = obj[k]; });
  return save(p);
}

module.exports = {
  load:    load,
  save:    save,
  get:     get,
  getAll:  getAll,
  set:     set,
  merge:   merge,
  DEFAULTS: DEFAULTS,
};
