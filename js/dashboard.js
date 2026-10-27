/**
 * Yogava Admin — Services dashboard logic
 * ---------------------------------------
 * Auth: two-step login with Appwrite's EMAIL MFA factor.
 *   Step 1: email + password  -> session (restricted until 2nd factor)
 *   Step 2: 6-digit code mailed to the account's (verified) email
 * Recovery codes (one-time shown at enrollment) can replace the code.
 *
 * Server-side enforcement is independent of this UI: the services
 * table only allows create/update/delete for label:admin, and panel
 * data requires a fully-authenticated (MFA-completed) session.
 *
 * Enrollment (first-time setup): verify email via emailed link ->
 * enable MFA -> show recovery codes once. The emailed verification
 * link redirects back to THIS page; the secret in the URL is
 * auto-completed here.
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
    setup: el('ad-setup-wrap'),
    mfa: el('ad-mfa-view'),
    recovery: el('ad-recovery-view'),
    panel: el('ad-panel-view'),
    userbox: el('ad-userbox'),
  };

  var state = {
    userId: null,
    email: '',
    emailVerified: false,
    mfaEnabled: false,
    sessionActive: false, // password step done (possibly awaiting MFA)
    challengeId: null,
    recoveryCodes: null,
  };

  function showMsg(target, text, ok) {
    target.textContent = text;
    target.className = 'ad-msg ' + (ok ? 'ok' : 'error');
    if (ok) window.setTimeout(function () { target.className = 'ad-msg'; }, 4000);
  }

  function hideAll() {
    V.login.style.display = 'none';
    V.mfa.classList.remove('visible');
    V.recovery.classList.remove('visible');
    V.panel.classList.remove('visible');
    V.userbox.classList.remove('visible');
    V.setup.classList.remove('visible');
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

  function showRecoveryCodes() {
    hideAll();
    el('ad-codes-box').textContent = (state.recoveryCodes || []).join('\n');
    V.recovery.classList.add('visible');
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

  // One-time recovery codes: try to show existing set; generate if none.
  // NOTE: codes are returned exactly once ever — if they were created
  // before but never saved, use "Regenerate recovery codes" (requires
  // a recent MFA challenge, i.e. do it right after signing in).
  function ensureRecoveryCodes() {
    return services.account.createMfaRecoveryCodes()
      .then(function (res) { state.recoveryCodes = res.recoveryCodes; })
      .catch(function () {
        state.recoveryCodes = null; // already exist but unreadable
      });
  }

  function areCodesGenerated() {
    return services.account.listMfaRecoveryCodes()
      .then(function (res) { return !!(res.recoveryCodes && res.recoveryCodes.length); });
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
    state.emailVerified = !!user.emailVerification;
    state.mfaEnabled = !!user.mfa;

    if (!isAdmin(user)) { showLogin('This account is not an admin.', false); return; }

    if (!state.mfaEnabled) {
      // Not enrolled yet: allow in (testing mode) with a nudge, or
      // if the email is verified, finish enrollment automatically.
      if (state.emailVerified && state.sessionActive) {
        areCodesGenerated()
          .then(function (already) {
            if (!already) { return ensureRecoveryCodes(); }
            state.recoveryCodes = null;
          })
          .then(function () {
            return services.account.updateMFA({ mfa: true });
          })
          .then(function () {
            state.mfaEnabled = true;
            if (state.recoveryCodes) {
              showRecoveryCodes();
            } else {
              // Codes already exist but can only be displayed once —
              // enter the panel; use "Regenerate recovery codes".
              showPanel(user);
            }
          })
          .catch(function (err) {
            showPanel(user); // don't block on enrollment hiccups
          });
        return;
      }
      showPanel(user);
      return;
    }

    // account.get() succeeded -> the session is FULLY authenticated
    // (Appwrite only resolves it when no factor is pending), so no
    // new challenge is needed regardless of MFA being enabled.
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

  // Recovery-code path: create a recoverycode challenge + complete it.
  el('ad-recovery-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = el('ad-recovery-code').value.trim();
    services.account.createMfaChallenge({ factor: 'recoverycode' })
      .then(function (ch) {
        return services.account.updateMfaChallenge({ challengeId: ch.$id, otp: code });
      })
      .then(function () { return services.account.get(); })
      .then(function (user) {
        el('ad-recovery-code').value = '';
        route(user);
      })
      .catch(function () {
        showMsg(el('ad-mfa-msg'), 'Invalid recovery code.', false);
      });
  });

  el('ad-codes-done').addEventListener('click', gate);

  // Regenerate recovery codes — possible only shortly after a fresh
  // MFA challenge (i.e., right after signing in with the emailed code).
  el('ad-regen-codes').addEventListener('click', function () {
    var y = services;
    var msg = el('ad-panel-msg');
    y.account.updateMfaRecoveryCodes()
      .then(function (res) {
        state.recoveryCodes = res.recoveryCodes;
        showRecoveryCodes();
      })
      .catch(function (err) {
        showMsg(msg,
          'Cannot regenerate right now — this works only shortly after ' +
          'signing in with your emailed code. Sign out and back in, then try again. ' +
          '(' + ((err && err.message) || err) + ')', false);
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

  /* ---------- one-time enrollment UI ---------- */

  el('ad-enroll-link').addEventListener('click', function () {
    V.setup.classList.toggle('visible');
    el('ad-setup-email').textContent = el('ad-email').value.trim() || 'your address';
  });

  el('ad-setup-send').addEventListener('click', function () {
    var msg = el('ad-setup-msg');
    var proceed = function () {
      services.account.createVerification({ url: window.location.href.split('?')[0] })
        .then(function () {
          showMsg(msg, 'Verification email sent — click the link in your inbox, then press “I verified”.', true);
        })
        .catch(function (err) {
          showMsg(msg, 'Could not send: ' + ((err && err.message) || err), false);
        });
    };
    if (state.sessionActive) { proceed(); return; }
    // No session yet: create one with the credentials typed above.
    services.account.createEmailPasswordSession({
      email: el('ad-email').value.trim(),
      password: el('ad-password').value,
    }).then(function () {
      state.sessionActive = true;
      proceed();
    }).catch(function () {
      showMsg(msg, 'Type your email + password above first, then click again.', false);
    });
  });

  el('ad-setup-done').addEventListener('click', function () {
    var msg = el('ad-setup-msg');
    services.account.get()
      .then(function (user) {
        if (!user.emailVerification) {
          showMsg(msg, 'Not verified yet — click the link in the email first.', false);
          return null;
        }
        return areCodesGenerated()
          .then(function (already) {
            if (!already) { return ensureRecoveryCodes(); }
            state.recoveryCodes = null;
          })
          .then(function () { return services.account.updateMFA({ mfa: true }); })
          .then(function () {
            state.mfaEnabled = true;
            if (!state.recoveryCodes) { return services.account.get().then(function (u2) { route(u2); }); }
            showRecoveryCodes();
          });
      })
      .catch(function () { showLogin('Session expired — sign in again.', false); });
  });

  /* ---------- emailed verification link auto-completion ---------- */

  (function handleVerifyRedirect() {
    var q = new URLSearchParams(window.location.search);
    var secret = q.get('secret');
    var userId = q.get('userId');
    if (!secret || !userId) return;
    services.account.updateVerification({ userId: userId, secret: secret })
      .then(function () {
        window.history.replaceState({}, '', window.location.pathname);
        showLogin('Email verified! Now finish two-step setup below.', true);
        V.setup.classList.add('visible');
      })
      .catch(function () {
        window.history.replaceState({}, '', window.location.pathname);
        showLogin('That verification link is invalid or expired.', false);
      });
  })();

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
