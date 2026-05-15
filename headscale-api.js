var http = require('http');
var https = require('https');
var url = require('url');

var BASE_URL = (process.env.HEADSCALE_URL || 'http://headscale:8080').replace(/\/+$/, '');
var API_KEY = process.env.HEADSCALE_API_KEY || '';

function apiRequest(method, apiPath, body, callback) {
  var fullUrl = BASE_URL + '/api/v1' + apiPath;
  var parsed = url.parse(fullUrl);
  var transport = parsed.protocol === 'https:' ? https : http;

  var options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.path,
    method: method,
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
    },
  };

  var data = body && method !== 'GET' ? JSON.stringify(body) : null;
  if (data) {
    options.headers['Content-Length'] = Buffer.byteLength(data);
  }

  var req = transport.request(options, function(res) {
    var chunks = [];
    res.on('data', function(chunk) { chunks.push(chunk); });
    res.on('end', function() {
      var responseBody = Buffer.concat(chunks).toString();

      if (res.statusCode < 200 || res.statusCode >= 300) {
        var detail = '';
        try { detail = JSON.parse(responseBody).message || responseBody; }
        catch(e) { detail = responseBody; }
        var err = new Error('Headscale API error (' + res.statusCode + '): ' + detail);
        err.status = res.statusCode;
        return callback(err);
      }

      if (res.statusCode === 204 || !responseBody) {
        return callback(null, null);
      }

      try {
        callback(null, JSON.parse(responseBody));
      } catch(e) {
        callback(new Error('Invalid JSON response from Headscale'));
      }
    });
  });

  req.on('error', function(err) {
    var error = new Error('Cannot reach Headscale at ' + BASE_URL + ': ' + err.message);
    error.status = 503;
    callback(error);
  });

  req.setTimeout(10000, function() {
    req.abort();
    var error = new Error('Request to Headscale timed out');
    error.status = 504;
    callback(error);
  });

  if (data) req.write(data);
  req.end();
}

// Nodes
exports.listNodes = function(callback) {
  apiRequest('GET', '/node', null, function(err, data) {
    if (err) return callback(err);
    callback(null, (data && data.nodes) || []);
  });
};

exports.deleteNode = function(nodeId, callback) {
  apiRequest('DELETE', '/node/' + nodeId, null, callback);
};

exports.renameNode = function(nodeId, newName, callback) {
  apiRequest('POST', '/node/' + nodeId + '/rename/' + encodeURIComponent(newName), null, callback);
};

exports.registerNode = function(user, key, callback) {
  apiRequest('POST', '/node/register?user=' + encodeURIComponent(user) + '&key=' + encodeURIComponent(key), null, callback);
};

// Users
exports.listUsers = function(callback) {
  apiRequest('GET', '/user', null, function(err, data) {
    if (err) return callback(err);
    callback(null, (data && data.users) || []);
  });
};

exports.createUser = function(name, callback) {
  apiRequest('POST', '/user', { name: name }, callback);
};

exports.deleteUser = function(id, callback) {
  apiRequest('DELETE', '/user/' + encodeURIComponent(id), null, callback);
};

exports.renameUser = function(id, newName, callback) {
  apiRequest('POST', '/user/' + encodeURIComponent(id) + '/rename/' + encodeURIComponent(newName), null, callback);
};

// Pre-auth keys
exports.listPreAuthKeys = function(user, callback) {
  apiRequest('GET', '/preauthkey?user=' + encodeURIComponent(user), null, function(err, data) {
    if (err) return callback(err);
    callback(null, (data && data.preAuthKeys) || []);
  });
};

exports.createPreAuthKey = function(userId, opts, callback) {
  var body = {
    user: userId,
    reusable: opts.reusable || false,
    ephemeral: opts.ephemeral || false,
    expiration: opts.expiration || new Date(Date.now() + 3600 * 1000).toISOString(),
  };
  apiRequest('POST', '/preauthkey', body, callback);
};

exports.expirePreAuthKey = function(user, key, callback) {
  apiRequest('POST', '/preauthkey/expire', { user: user, key: key }, callback);
};

// Policy
exports.getPolicy = function(callback) {
  apiRequest('GET', '/policy', null, function(err, data) {
    if (err) return callback(err);
    callback(null, data || {});
  });
};
