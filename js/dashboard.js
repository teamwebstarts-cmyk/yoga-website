/**
 * Yogava Admin — Services dashboard logic
 * ---------------------------------------
 * Auth gate: only accounts carrying the `admin` label (set in the
 * Appwrite Console / via server API) may use this page. Writes are
 * ALSO enforced server-side by table permissions
 * (create/update/delete = label:admin), so bypassing this UI does
 * not grant write access to non-admin users.
 *
 * Session is checked silently on load (account.get()). No admin
 * credentials are stored in code; login uses Appwrite's email
 * password session, scoped to the registered localhost platforms.
 */
(function () {
  'use strict';

  var services = window.yogavaAppwrite;
  if (!services || !services.tablesDB || !services.tables || !services.tables.services) {
    document.getElementById('ad-login-msg').textContent =
      'Appwrite is not configured — set APPWRITE_DATABASE_ID / APPWRITE_TABLES in .env and re-run _tools/sync-appwrite-env.py.';
    document.getElementById('ad-login-msg').className = 'ad-msg error';
    return;
  }

  var DB = services.databaseId;
  var TABLE = services.tables.services;

  var el = function (id) { return document.getElementById(id); };
  var views = {
    login: el('ad-login-view'),
    panel: el('ad-panel-view'),
    userbox: el('ad-userbox'),
  };

  function showMsg(target, text, ok) {
    target.textContent = text;
    target.className = 'ad-msg ' + (ok ? 'ok' : 'error');
    if (ok) {
      window.setTimeout(function () { target.className = 'ad-msg'; }, 2600);
    }
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- auth gate ---------- */

  function showLogin() {
    views.login.style.display = '';
    views.panel.classList.remove('visible');
    views.userbox.classList.remove('visible');
  }

  function showPanel(user) {
    views.login.style.display = 'none';
    views.panel.classList.add('visible');
    views.userbox.classList.add('visible');
    el('ad-user-email').textContent = user.email;
    loadRows();
  }

  function isAdmin(user) {
    return !!(user && user.labels && user.labels.indexOf('admin') !== -1);
  }

  function gate() {
    services.account.get()
      .then(function (user) {
        if (isAdmin(user)) showPanel(user); else showLogin();
      })
      .catch(function () { showLogin(); });
  }

  el('ad-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = el('ad-login-btn');
    btn.disabled = true;
    services.account.createEmailPasswordSession({
      email: el('ad-email').value.trim(),
      password: el('ad-password').value,
    }).then(gate).catch(function (err) {
      showMsg(el('ad-login-msg'), (err && err.message) || 'Sign-in failed.', false);
    }).finally(function () {
      btn.disabled = false;
      el('ad-password').value = '';
    });
  });

  el('ad-logout').addEventListener('click', function () {
    services.account.deleteSession('current').then(function () {
      showLogin();
    }).catch(function () { showLogin(); });
  });

  /* ---------- rows / CRUD ---------- */

  function loadRows() {
    services.tablesDB.listRows({
      databaseId: DB,
      tableId: TABLE,
      queries: [window.Appwrite.Query.orderAsc('number')],
    }).then(function (res) {
      renderRows(res.rows || []);
    }).catch(function (err) {
      showMsg(el('ad-panel-msg'), 'Could not load services: ' + ((err && err.message) || err), false);
    });
  }

  function renderRows(rows) {
    var tbody = el('ad-rows');
    tbody.innerHTML = '';
    rows.forEach(function (row) {
      var tr = document.createElement('tr');

      var tdNum = document.createElement('td');
      tdNum.textContent = row.number;
      var tdImg = document.createElement('td');
      var img = document.createElement('img');
      img.src = row.image;
      img.alt = '';
      tdImg.appendChild(img);
      var tdTitle = document.createElement('td');
      tdTitle.textContent = row.title;
      var tdText = document.createElement('td');
      tdText.textContent = row.text;

      var tdActions = document.createElement('td');
      var actions = document.createElement('div');
      actions.className = 'ad-actions';

      var editBtn = document.createElement('button');
      editBtn.className = 'ad-btn secondary';
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', function () { startEdit(row); });

      var delBtn = document.createElement('button');
      delBtn.className = 'ad-btn danger';
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () { removeRow(row); });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      tdActions.appendChild(actions);

      tr.appendChild(tdNum);
      tr.appendChild(tdImg);
      tr.appendChild(tdTitle);
      tr.appendChild(tdText);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  function resetForm() {
    el('ad-form').reset();
    el('f-rowid').value = '';
    el('ad-form-title').textContent = 'New service';
    el('f-preview').style.display = 'none';
  }

  function startEdit(row) {
    el('f-rowid').value = row.$id;
    el('f-number').value = row.number || '';
    el('f-title').value = row.title || '';
    el('f-image').value = row.image || '';
    el('f-text').value = row.text || '';
    el('f-link').value = row.link || '#';
    el('ad-form-title').textContent = 'Edit service — ' + (row.number || '');
    var pv = el('f-preview');
    pv.src = row.image || '';
    pv.style.display = row.image ? 'block' : 'none';
    el('f-number').focus();
    window.scrollTo({ top: el('ad-form').getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }

  function removeRow(row) {
    if (!window.confirm('Delete service "' + (row.title || row.$id) + '"? This cannot be undone.')) return;
    services.tablesDB.deleteRow({ databaseId: DB, tableId: TABLE, rowId: row.$id })
      .then(function () {
        showMsg(el('ad-panel-msg'), 'Deleted "' + (row.title || row.$id) + '".', true);
        loadRows();
      })
      .catch(function (err) {
        showMsg(el('ad-panel-msg'), 'Delete failed: ' + ((err && err.message) || err), false);
      });
  }

  el('ad-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = el('ad-save');
    btn.disabled = true;

    var data = {
      number: el('f-number').value.trim(),
      title: el('f-title').value.trim(),
      image: el('f-image').value.trim(),
      text: el('f-text').value.trim(),
      link: el('f-link').value.trim() || '#',
    };
    var rowId = el('f-rowid').value;

    var operation = rowId
      ? services.tablesDB.updateRow({ databaseId: DB, tableId: TABLE, rowId: rowId, data: data })
      : services.tablesDB.createRow({
          databaseId: DB, tableId: TABLE,
          rowId: window.Appwrite.ID.unique(), data: data,
        });

    operation.then(function () {
      showMsg(el('ad-panel-msg'), rowId ? 'Service updated.' : 'Service created.', true);
      resetForm();
      loadRows();
    }).catch(function (err) {
      showMsg(el('ad-panel-msg'), 'Save failed: ' + ((err && err.message) || err), false);
    }).finally(function () {
      btn.disabled = false;
    });
  });

  el('ad-cancel').addEventListener('click', resetForm);
  el('ad-new').addEventListener('click', function () {
    resetForm();
    el('f-number').focus();
  });
  el('f-image').addEventListener('change', function () {
    var pv = el('f-preview');
    pv.src = el('f-image').value.trim();
    pv.style.display = el('f-image').value.trim() ? 'block' : 'none';
  });

  gate();
})();
