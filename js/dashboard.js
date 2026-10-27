/**
 * Yogava Admin — Services dashboard logic
 * ---------------------------------------
 * Auth: two-step login with Appwrite's EMAIL MFA factor.
 *   Step 1: email + password  -> session (restricted until 2nd factor)
 *   Step 2: 6-digit code mailed to the account's (verified) email
 *
 * Server-side enforcement is independent of this UI: the services
 * table only allows create/update/delete for label:admin, and panel
 * data requires a fully-authenticated (MFA-completed) session.
 *
 * Email MFA is a BACKEND default, not a UI toggle: the admin account
 * is provisioned (label admin, verified email, mfa=true) by
 * `_tools/sync-appwrite-env.py --bootstrap-admin`, so Appwrite itself
 * forces the second factor on every sign-in. This page never enables
 * or disables it; it only answers the challenge.
 */
(function () {
  'use strict';

  var services = window.yogavaAppwrite;
  if (!services || !services.tablesDB || !services.tables || !services.tables.services) {
    var m0 = document.getElementById('ad-login-msg');
    m0.textContent = 'Appwrite is not configured — set APPWRITE_DATABASE_ID / APPWRITE_TABLES in .env and re-run _tools/sync-appwrite-env.py.';
    m0.className = 'ad-msg error';
    return;
  }

  var DB = services.databaseId;
  var TABLE = services.tables.services;

  var el = function (id) { return document.getElementById(id); };
  var V = {
    login: el('ad-login-view'),
    mfa: el('ad-mfa-view'),
    panel: el('ad-panel-view'),
    userbox: el('ad-userbox'),
  };

  var state = {
    userId: null,
    email: '',
    sessionActive: false, // password step done (possibly awaiting MFA)
    challengeId: null,
  };

  function showMsg(target, text, ok) {
    target.textContent = text;
    target.className = 'ad-msg ' + (ok ? 'ok' : 'error');
    if (ok) window.setTimeout(function () { target.className = 'ad-msg'; }, 4000);
  }

  function hideAll() {
    V.login.style.display = 'none';
    V.mfa.classList.remove('visible');
    V.panel.classList.remove('visible');
    V.userbox.classList.remove('visible');
  }

  function showLogin(msg, ok) {
    hideAll();
    V.login.style.display = '';
    if (msg) showMsg(el('ad-login-msg'), msg, ok);
  }

  function showMfa() {
    hideAll();
    el('ad-mfa-email').textContent = state.email;
    V.mfa.classList.add('visible');
    el('ad-otp').focus();
  }

  function showPanel(user) {
    hideAll();
    V.login.style.display = 'none';
    V.panel.classList.add('visible');
    V.userbox.classList.add('visible');
    el('ad-user-email').textContent = user.email;
    loadRows();
  }

  function isAdmin(user) {
    return !!(user && user.labels && user.labels.indexOf('admin') !== -1);
  }

  /* ---------- MFA challenge (email factor) ---------- */

  function createEmailChallenge() {
    return services.account.createMfaChallenge({ factor: 'email' })
      .then(function (ch) { state.challengeId = ch.$id; });
  }

  function completeChallenge(otp) {
    return services.account.updateMfaChallenge({
      challengeId: state.challengeId,
      otp: otp,
    });
  }

  /* ---------- auth state machine ---------- */

  // Decides the right view once we know the user/factor state.
  function route(user) {
    state.userId = user.$id;
    state.email = user.email;

    if (!isAdmin(user)) { showLogin('This account is not an admin.', false); return; }

    // account.get() succeeded -> the session is FULLY authenticated
    // (Appwrite only resolves it when no factor is pending). MFA is a
    // backend default: any sign-in that reaches this point already
    // cleared the email-factor challenge.
    showPanel(user);
  }

  function gate(knownEmail) {
    services.account.get()
      .then(function (user) {
        state.sessionActive = true;
        route(user);
      })
      .catch(function (err) {
        if (err && err.type === 'user_more_factors_required') {
          // Password accepted, waiting for 2nd factor.
          state.sessionActive = true;
          state.email = knownEmail || 'your address';
          createEmailChallenge()
            .then(function (ch) {
              state.challengeId = ch.$id;
              showMfa();
            })
            .catch(function (e2) {
              showLogin('Could not send the code: ' + ((e2 && e2.message) || e2), false);
            });
          return;
        }
        state.sessionActive = false;
        showLogin();
      });
  }

  /* ---------- login form (step 1) ---------- */

  el('ad-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = el('ad-login-btn');
    btn.disabled = true;
    services.account.createEmailPasswordSession({
      email: el('ad-email').value.trim(),
      password: el('ad-password').value,
    }).then(function () {
      state.sessionActive = true;
      return services.account.get();
    }).then(function (user) {
      route(user);
    }).catch(function (err) {
      state.sessionActive = false;
      if (err && err.type === 'user_more_factors_required') {
        gate(el('ad-email').value.trim()); // triggers the email challenge
      } else {
        showMsg(el('ad-login-msg'), (err && err.message) || 'Sign-in failed.', false);
      }
    }).finally(function () {
      btn.disabled = false;
      el('ad-password').value = '';
    });
  });

  /* ---------- MFA challenge form (step 2) ---------- */

  el('ad-mfa-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = el('ad-mfa-btn');
    btn.disabled = true;
    completeChallenge(el('ad-otp').value.trim())
      .then(function () { return services.account.get(); })
      .then(function (user) {
        el('ad-otp').value = '';
        route(user);
      })
      .catch(function (err) {
        showMsg(el('ad-mfa-msg'), 'Invalid or expired code — try again or resend.', false);
      })
      .finally(function () { btn.disabled = false; });
  });

  el('ad-mfa-resend').addEventListener('click', function () {
    createEmailChallenge()
      .then(function () { showMsg(el('ad-mfa-msg'), 'New code sent — check your inbox.', true); })
      .catch(function (err) {
        showMsg(el('ad-mfa-msg'), 'Resend failed: ' + ((err && err.message) || err), false);
      });
  });

  /* ---------- logout ---------- */

  el('ad-logout').addEventListener('click', function () {
    services.account.deleteSession('current')
      .catch(function () {})
      .finally(function () {
        state.sessionActive = false;
        showLogin('Signed out.', true);
      });
  });

  /* ---------- rows / CRUD (unchanged) ---------- */

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
