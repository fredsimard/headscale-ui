#!/usr/bin/env node
var bcrypt = require('bcryptjs');

var password = process.argv[2];
if (!password) {
  console.error('Usage: node hash-password.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 12, function(err, hash) {
  if (err) { console.error(err); process.exit(1); }
  console.log(hash);
});
