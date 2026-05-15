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

// Device status filter — works with search
var currentStatusFilter = 'all';

function applyDeviceFilters() {
  var searchInput = document.getElementById('deviceSearch');
  var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  var table = document.getElementById('devicesTable');
  if (!table) return;

  table.querySelectorAll('tbody tr').forEach(function(row) {
    if (row.querySelector('td[colspan]')) {
      row.style.display = (!query && currentStatusFilter === 'all') ? '' : 'none';
      return;
    }
    // Status filter
    var statusMatch = currentStatusFilter === 'all' || row.dataset.status === currentStatusFilter;
    // Search filter
    var searchMatch = true;
    if (query) {
      var haystack = '';
      row.querySelectorAll('td').forEach(function(cell) {
        haystack += ' ' + cell.textContent;
        if (cell.dataset.value) haystack += ' ' + cell.dataset.value;
        cell.querySelectorAll('[data-ip]').forEach(function(el) {
          haystack += ' ' + el.dataset.ip;
        });
      });
      searchMatch = haystack.toLowerCase().indexOf(query) !== -1;
    }
    row.style.display = (statusMatch && searchMatch) ? '' : 'none';
  });
}

document.querySelectorAll('.status-filter').forEach(function(btn) {
  btn.addEventListener('click', function() {
    currentStatusFilter = btn.dataset.filter;
    document.querySelectorAll('.status-filter').forEach(function(b) {
      b.classList.toggle('active',      b === btn);
      b.classList.toggle('btn-primary', b === btn);
      b.classList.toggle('btn-secondary', b !== btn);
    });
    applyDeviceFilters();
  });
});

// Hook device search into combined filter
var deviceSearchInput = document.getElementById('deviceSearch');
if (deviceSearchInput) {
  deviceSearchInput.addEventListener('input', applyDeviceFilters);
}

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

// Users — rename modal
var renameUserModal = document.getElementById('renameUserModal');
if (renameUserModal) {
  renameUserModal.addEventListener('show.bs.modal', function(e) {
    var btn = e.relatedTarget;
    this.querySelector('#renameUserId').value        = btn.dataset.userId;
    this.querySelector('#renameUserName').value      = btn.dataset.userName;
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

// Sortable tables — click any labelled <th> to sort asc/desc
document.querySelectorAll('table[data-sortable]').forEach(function(table) {
  var thead = table.querySelector('thead tr');
  if (!thead) return;
  var ths = Array.from(thead.querySelectorAll('th'));

  ths.forEach(function(th, colIndex) {
    if (!th.textContent.trim()) return; // skip action columns (no label)
    th.classList.add('sortable');

    th.addEventListener('click', function() {
      var wasAsc = th.classList.contains('sort-asc');
      var asc = !wasAsc;

      // Reset all headers in this table
      ths.forEach(function(other) {
        other.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(asc ? 'sort-asc' : 'sort-desc');

      var tbody = table.querySelector('tbody');
      var rows = Array.from(tbody.querySelectorAll('tr')).filter(function(r) {
        // Skip empty-state rows (colspan cells)
        return !r.querySelector('td[colspan]');
      });

      rows.sort(function(a, b) {
        var cells = a.querySelectorAll('td');
        var cellsB = b.querySelectorAll('td');
        var cellA = cells[colIndex];
        var cellB = cellsB[colIndex];
        if (!cellA || !cellB) return 0;

        // Use data-value when present (ISO dates, numeric IDs), else visible text
        var valA = (cellA.dataset.value !== undefined && cellA.dataset.value !== '')
          ? cellA.dataset.value : cellA.textContent.trim();
        var valB = (cellB.dataset.value !== undefined && cellB.dataset.value !== '')
          ? cellB.dataset.value : cellB.textContent.trim();

        // Numeric comparison
        var numA = Number(valA);
        var numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return asc ? numA - numB : numB - numA;
        }

        // Lexicographic (works for ISO date strings too)
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });

      rows.forEach(function(row) { tbody.appendChild(row); });
    });
  });
});

// Table search — real-time filtering across all visible columns
// (skips devicesTable which has its own combined filter with status)
document.querySelectorAll('.search-box').forEach(function(input) {
  var tableId = input.dataset.table;
  if (tableId === 'devicesTable') return;  // handled by applyDeviceFilters
  var table = document.getElementById(tableId);
  if (!table) return;

  input.addEventListener('input', function() {
    var query = input.value.toLowerCase().trim();
    var rows = table.querySelectorAll('tbody tr');

    rows.forEach(function(row) {
      if (row.querySelector('td[colspan]')) {
        row.style.display = query ? 'none' : '';
        return;
      }
      if (!query) {
        row.style.display = '';
        return;
      }
      var cells = row.querySelectorAll('td');
      var haystack = '';
      cells.forEach(function(cell) {
        haystack += ' ' + cell.textContent;
        if (cell.dataset.value) haystack += ' ' + cell.dataset.value;
        cell.querySelectorAll('[data-ip]').forEach(function(el) {
          haystack += ' ' + el.dataset.ip;
        });
      });
      haystack = haystack.toLowerCase();
      row.style.display = haystack.indexOf(query) !== -1 ? '' : 'none';
    });
  });
});

// Dark mode toggle
var themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', function() {
    var html = document.documentElement;
    var isDark = html.getAttribute('data-bs-theme') === 'dark';
    var newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    themeToggle.querySelector('i').className = newTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
    fetch('/prefs/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    });
  });
}

// Preferences — radio card visual selection
document.querySelectorAll('.pref-radio-card input[type="radio"]').forEach(function(input) {
  input.addEventListener('change', function() {
    var name = input.name;
    document.querySelectorAll('.pref-radio-card input[name="' + name + '"]').forEach(function(i) {
      i.closest('.pref-radio-card').classList.toggle('selected', i === input);
    });
  });
});

// Auto-fill search box from ?search= URL parameter — must run last so all
// event listeners above are already registered before dispatchEvent fires
(function() {
  var params = new URLSearchParams(window.location.search);
  var q = params.get('search');
  if (!q) return;
  var input = document.querySelector('.search-box');
  if (!input) return;
  input.value = q;
  input.dispatchEvent(new Event('input'));
})();
