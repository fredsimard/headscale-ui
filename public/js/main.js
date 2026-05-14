// Clipboard helper — works over plain HTTP and HTTPS
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'absolute';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

// IP pills — click to copy
document.querySelectorAll('.ip-pill').forEach(function(pill) {
  pill.addEventListener('click', function() {
    copyText(pill.dataset.ip).then(function() {
      var original = pill.textContent;
      pill.textContent = 'Copied!';
      pill.classList.add('ip-pill-copied');
      setTimeout(function() {
        pill.textContent = original;
        pill.classList.remove('ip-pill-copied');
      }, 1500);
    });
  });
});

// Device status filter
document.querySelectorAll('.status-filter').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var filter = btn.dataset.filter;
    document.querySelectorAll('.status-filter').forEach(function(b) {
      b.classList.toggle('active',      b === btn);
      b.classList.toggle('btn-primary', b === btn);
      b.classList.toggle('btn-secondary', b !== btn);
    });
    document.querySelectorAll('tbody tr[data-status]').forEach(function(row) {
      row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
    });
  });
});

// Devices — rename modal
var renameModal = document.getElementById('renameModal');
if (renameModal) {
  renameModal.addEventListener('show.bs.modal', function(e) {
    var btn = e.relatedTarget;
    this.querySelector('#renameNodeId').value = btn.dataset.nodeId;
    this.querySelector('#newName').value       = btn.dataset.nodeName;
  });
}

// Devices — delete modal
var deleteModal = document.getElementById('deleteModal');
if (deleteModal) {
  deleteModal.addEventListener('show.bs.modal', function(e) {
    var btn = e.relatedTarget;
    this.querySelector('#deleteNodeId').value       = btn.dataset.nodeId;
    this.querySelector('#deleteNodeName').textContent = btn.dataset.nodeName;
  });
}

// Users — delete modal
var deleteUserModal = document.getElementById('deleteUserModal');
if (deleteUserModal) {
  deleteUserModal.addEventListener('show.bs.modal', function(e) {
    var btn = e.relatedTarget;
    this.querySelector('#deleteUserId').value         = btn.dataset.userId;
    this.querySelector('#deleteUserLabel').textContent = btn.dataset.userName;
  });
}

// Pre-auth keys — copy key button
document.querySelectorAll('.copy-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    copyText(btn.dataset.key).then(function() {
      var icon = btn.querySelector('i');
      icon.className = 'bi bi-check';
      setTimeout(function() { icon.className = 'bi bi-clipboard'; }, 1500);
    });
  });
});

// Preferences — radio card visual selection
document.querySelectorAll('.pref-radio-card input[type="radio"]').forEach(function(input) {
  input.addEventListener('change', function() {
    var name = input.name;
    document.querySelectorAll('.pref-radio-card input[name="' + name + '"]').forEach(function(i) {
      i.closest('.pref-radio-card').classList.toggle('selected', i === input);
    });
  });
});
