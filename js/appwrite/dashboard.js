/**
 * Lotus U Yoga — admin workspace
 * ------------------------------
 * A card-based console for the two things the studio actually edits:
 *
 *   Workshops — retreats, trainings and events, grouped by status
 *               (upcoming / ongoing / completed) and fully editable.
 *   Services  — the five catalogue cards on the public homepage slider.
 *
 * Design notes
 *  - One small schema table (SCHEMAS) drives both the editor form and the
 *    card renderer, so adding a field is a one-line change.
 *  - All user data reaches the DOM through textContent, never innerHTML.
 *  - Image paths are restricted to local `images/…` files, matching the
 *    validation used on the public page.
 *  - Every failure is translated into something the studio owner can act
 *    on (read-only project, expired session, missing table, permissions).
 *
 * Auth: email + password, then Appwrite's email MFA challenge when the
 * account has a second factor configured.
 */
(function () {
  'use strict';

  var api = window.yogavaAppwrite;
  var $ = function (id) { return document.getElementById(id); };

  function fatal(message) {
    var box = $('auth-msg');
    box.hidden = false;
    box.className = 'banner error';
    box.textContent = message;
  }

  if (!api || !api.tablesDB) {
    fatal('Appwrite is not configured. Check js/appwrite/appwrite-config.js and that the SDK script loads.');
    return;
  }

  var DB = api.databaseId;
  var TABLES = api.tables || {};
  var WORKSHOPS = TABLES.workshops || 'workshops';
  var SERVICES = TABLES.services || 'services';

  /* =========================================================
     Schema
     ========================================================= */

  var STATUS_LABELS = { upcoming: 'Upcoming', ongoing: 'Ongoing', completed: 'Completed' };

  var SCHEMAS = {
    workshops: {
      table: WORKSHOPS,
      noun: 'workshop',
      newLabel: '+ New workshop',
      title: 'Workshops',
      sub: 'Retreats, trainings and events — past, present and planned.',
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true, full: true, placeholder: 'Rishikesh Retreat — November' },
        { key: 'type', label: 'Type', type: 'select', options: ['Retreat', 'Workshop', 'Training', 'Event'], required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['upcoming', 'ongoing', 'completed'], labels: STATUS_LABELS, required: true },
        { key: 'startDate', label: 'Start date', type: 'date' },
        { key: 'endDate', label: 'End date', type: 'date' },
        { key: 'mode', label: 'Mode', type: 'select', options: ['Offline', 'Online', 'Hybrid'] },
        { key: 'location', label: 'Location', type: 'text', placeholder: 'Rishikesh, Uttarakhand' },
        { key: 'price', label: 'Price', type: 'text', placeholder: '₹12,500' },
        { key: 'seats', label: 'Seats', type: 'number', placeholder: '12' },
        { key: 'image', label: 'Image path', type: 'text', full: true, placeholder: 'images/resource/gallary2-1.jpg' },
        { key: 'summary', label: 'Short description', type: 'textarea', full: true, placeholder: 'One or two lines shown on the card.', maxlength: 240 },
        { key: 'published', label: 'Published on the website', type: 'checkbox', full: true }
      ]
    },

    services: {
      table: SERVICES,
      noun: 'service',
      newLabel: '+ New service',
      title: 'Services',
      sub: 'The cards in the homepage “Retreats & Signature Experiences” slider.',
      fields: [
        { key: 'number', label: 'Order', type: 'text', placeholder: '01' },
        { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Rishikesh Retreat' },
        { key: 'image', label: 'Image path', type: 'text', full: true, placeholder: 'images/resource/service2-1.jpg' },
        { key: 'text', label: 'Description', type: 'textarea', full: true, maxlength: 240 },
        { key: 'line2', label: 'Second line (optional)', type: 'text', full: true },
        { key: 'link', label: 'Link', type: 'text', full: true, placeholder: '#contact' },
        { key: 'published', label: 'Visible on the website', type: 'checkbox', full: true }
      ]
    }
  };

  /* =========================================================
     Errors
     ========================================================= */

  function codeOf(err) {
    return err && (err.code || (err.response && err.response.code));
  }

  function describeError(err, noun) {
    var code = codeOf(err);
    var type = err && err.type;
    if (code === 402 || type === 'team_read_only') {
      return 'The Appwrite project is in read-only mode, so nothing can be saved. An organisation admin must fix the billing/plan state in the Appwrite console (Organisation → Billing).';
    }
    if (code === 401) {
      return 'Your session expired. Sign in again — nothing you typed has been lost.';
    }
    if (code === 403) {
      return 'This account is signed in but is not allowed to change this table. Check the admin label and the table permissions in Appwrite.';
    }
    if (code === 404) {
      return 'The ' + (noun || 'table') + ' table does not exist yet. Run: node tools/setup-appwrite.mjs';
    }
    if (code === 0) {
      return 'Could not reach Appwrite. Check your connection.';
    }
    if (code >= 500) {
      return 'Appwrite is having trouble right now. Try again in a moment.';
    }
    return (err && err.message) || 'Something went wrong. Please try again.';
  }

  function banner(node, text, kind) {
    if (!text) { node.hidden = true; node.textContent = ''; return; }
    node.hidden = false;
    node.className = 'banner ' + (kind || 'info');
    node.textContent = text;
    if (kind === 'ok') {
      window.setTimeout(function () {
        if (node.textContent === text) { node.hidden = true; node.textContent = ''; }
      }, 4000);
    }
  }

  /* =========================================================
     Helpers
     ========================================================= */

  function safeImage(path) {
    var value = String(path == null ? '' : path).trim();
    if (!value) return '';
    if (value.charAt(0) === '/' || value.charAt(0) === '.') return value;
    if (/^images\/[\w./-]+$/i.test(value)) return value;
    return '';
  }

  function dateValue(value) {
    if (!value) return NaN;
    var d = new Date(value);
    return isNaN(d.getTime()) ? NaN : d.getTime();
  }

  function fmtDate(value) {
    var d = new Date(value);
    if (!value || isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtRange(from, to) {
    var a = fmtDate(from);
    var b = fmtDate(to);
    if (a && b && a !== b) return a + ' – ' + b;
    return a || b || '';
  }

  function statusOf(row) {
    var s = String(row.status == null ? '' : row.status).toLowerCase();
    return STATUS_LABELS[s] ? s : 'upcoming';
  }

  // Running work first, then what is coming, then the archive. Within a
  // group: soonest first, except completed, where the most recent is most
  // useful at the top.
  var STATUS_ORDER = { ongoing: 0, upcoming: 1, completed: 2 };

  function sortByStart(rows) {
    return rows.slice().sort(function (a, b) {
      var order = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)];
      if (order) return order;

      var da = dateValue(a.startDate);
      var db = dateValue(b.startDate);
      if (isNaN(da)) da = Number.MAX_SAFE_INTEGER;
      if (isNaN(db)) db = Number.MAX_SAFE_INTEGER;
      return statusOf(a) === 'completed' ? db - da : da - db;
    });
  }

  function sortByOrder(rows) {
    return rows.slice().sort(function (a, b) {
      var na = parseFloat(String(a.number == null ? '' : a.number).replace(/[^\d.-]/g, ''));
      var nb = parseFloat(String(b.number == null ? '' : b.number).replace(/[^\d.-]/g, ''));
      if (isNaN(na)) na = Number.MAX_SAFE_INTEGER;
      if (isNaN(nb)) nb = Number.MAX_SAFE_INTEGER;
      return na - nb;
    });
  }

  /* =========================================================
     State
     ========================================================= */

  var state = {
    view: 'overview',
    workshops: [],
    services: [],
    filter: 'all',
    query: '',
    serviceQuery: '',
    loaded: { workshops: false, services: false },
    user: null
  };

  /* =========================================================
     Auth
     ========================================================= */

  var auth = { challengeId: null, email: '' };

  function showAuth(message, kind) {
    $('auth-view').hidden = false;
    $('app-view').hidden = true;
    $('mfa-form').hidden = true;
    $('login-form').hidden = false;
    $('auth-sub').textContent = 'Sign in to manage workshops, retreats and service cards.';
    if (message) banner($('auth-msg'), message, kind || 'error');
  }

  function showApp(user) {
    state.user = user;
    $('auth-view').hidden = true;
    $('app-view').hidden = false;
    $('ad-user-email').textContent = user.email || '';
    loadWorkshops();
    loadServices();
    switchView('overview');
  }

  function isAdmin(user) {
    return !!(user && user.labels && user.labels.indexOf('admin') !== -1);
  }

  function route(user) {
    if (!isAdmin(user)) {
      showAuth('This account is not an admin. Ask the studio owner to add the “admin” label to your user in Appwrite.', 'error');
      return;
    }
    showApp(user);
  }

  function startMfa(email) {
    auth.email = email || 'your address';
    $('mfa-email').textContent = auth.email;
    $('login-form').hidden = true;
    $('mfa-form').hidden = false;
    $('auth-sub').textContent = 'Two-step verification keeps the studio account safe.';
    api.account.createMfaChallenge({ factor: 'email' }).then(function (ch) {
      auth.challengeId = ch.$id;
      $('ad-otp').focus();
    }).catch(function (err) {
      banner($('auth-msg'), 'Could not send the code: ' + describeError(err), 'error');
    });
  }

  function gate() {
    api.account.get().then(function (user) {
      route(user);
    }).catch(function (err) {
      if (err && err.type === 'user_more_factors_required') {
        startMfa();
        return;
      }
      showAuth('', null);
    });
  }

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('login-btn');
    btn.disabled = true;
    banner($('auth-msg'), '', null);

    api.account.createEmailPasswordSession({
      email: $('ad-email').value.trim(),
      password: $('ad-password').value
    }).then(function () {
      return api.account.get();
    }).then(function (user) {
      route(user);
    }).catch(function (err) {
      if (err && err.type === 'user_more_factors_required') {
        startMfa($('ad-email').value.trim());
      } else {
        banner($('auth-msg'), (err && err.message) || 'Sign-in failed.', 'error');
      }
    }).finally(function () {
      btn.disabled = false;
      $('ad-password').value = '';
    });
  });

  $('mfa-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('mfa-btn');
    btn.disabled = true;
    api.account.updateMfaChallenge({ challengeId: auth.challengeId, otp: $('ad-otp').value.trim() })
      .then(function () { return api.account.get(); })
      .then(function (user) {
        $('ad-otp').value = '';
        $('mfa-form').hidden = true;
        $('login-form').hidden = false;
        route(user);
      })
      .catch(function () {
        banner($('auth-msg'), 'That code did not work. Try again or resend it.', 'error');
      })
      .finally(function () { btn.disabled = false; });
  });

  $('mfa-resend').addEventListener('click', function () {
    api.account.createMfaChallenge({ factor: 'email' }).then(function (ch) {
      auth.challengeId = ch.$id;
      banner($('auth-msg'), 'A new code is on its way.', 'ok');
    }).catch(function (err) {
      banner($('auth-msg'), 'Resend failed: ' + describeError(err), 'error');
    });
  });

  $('ad-logout').addEventListener('click', function () {
    api.account.deleteSession('current').catch(function () {}).finally(function () {
      state.user = null;
      state.loaded = { workshops: false, services: false };
      state.workshops = [];
      state.services = [];
      showAuth('Signed out.', 'ok');
    });
  });

  /* =========================================================
     Data
     ========================================================= */

  function listRows(tableId) {
    return api.tablesDB.listRows({
      databaseId: DB,
      tableId: tableId,
      queries: [window.Appwrite.Query.limit(200)]
    }).then(function (res) {
      return res.rows || [];
    });
  }

  function loadWorkshops() {
    var grid = $('workshops-grid');
    grid.textContent = '';
    var holder = document.createElement('div');
    holder.className = 'state';
    holder.textContent = 'Loading workshops…';
    grid.appendChild(holder);

    listRows(WORKSHOPS).then(function (rows) {
      state.workshops = rows;
      state.loaded.workshops = true;
      renderWorkshops();
      renderStats();
    }).catch(function (err) {
      state.loaded.workshops = false;
      grid.textContent = '';
      renderState(grid, 'Workshops could not load',
        describeError(err, 'workshops'),
        codeOf(err) === 404 ? { label: 'How to create it', href: null } : null);
      renderStats();
    });
  }

  function loadServices() {
    var grid = $('services-grid');
    grid.textContent = '';
    var holder = document.createElement('div');
    holder.className = 'state';
    holder.textContent = 'Loading services…';
    grid.appendChild(holder);

    listRows(SERVICES).then(function (rows) {
      state.services = rows;
      state.loaded.services = true;
      renderServices();
    }).catch(function (err) {
      grid.textContent = '';
      renderState(grid, 'Services could not load', describeError(err, 'services'), null);
    });
  }

  /* =========================================================
     Rendering
     ========================================================= */

  function renderState(container, title, text, action) {
    var box = document.createElement('div');
    box.className = 'state';
    var h = document.createElement('strong');
    h.textContent = title;
    var p = document.createElement('div');
    p.textContent = text;
    box.appendChild(h);
    box.appendChild(p);
    if (action && action.label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-soft btn-sm';
      b.textContent = action.label;
      b.addEventListener('click', function () { switchView('workshops'); });
      box.appendChild(b);
    }
    container.appendChild(box);
  }

  function statusBadge(status) {
    var b = document.createElement('span');
    b.className = 'badge ' + status;
    b.textContent = STATUS_LABELS[status] || status;
    return b;
  }

  function workshopCard(row) {
    var card = document.createElement('article');
    card.className = 'wcard';

    var media = document.createElement('div');
    media.className = 'wcard-media';
    var src = safeImage(row.image);
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () {
        img.remove();
        var fb = document.createElement('div');
        fb.className = 'fallback';
        fb.textContent = 'No image';
        media.appendChild(fb);
      });
      media.appendChild(img);
    } else {
      var fb2 = document.createElement('div');
      fb2.className = 'fallback';
      fb2.textContent = 'No image';
      media.appendChild(fb2);
    }
    media.appendChild(statusBadge(statusOf(row)));
    if (row.published === false) {
      var draft = document.createElement('span');
      draft.className = 'badge draft';
      draft.style.left = 'auto';
      draft.style.right = '10px';
      draft.textContent = 'Draft';
      media.appendChild(draft);
    }

    var body = document.createElement('div');
    body.className = 'wcard-body';

    var h3 = document.createElement('h3');
    h3.textContent = row.title || 'Untitled workshop';

    var meta = document.createElement('div');
    meta.className = 'wcard-meta';
    var bits = [];
    var when = fmtRange(row.startDate, row.endDate);
    if (when) bits.push(when);
    if (row.location) bits.push(row.location);
    if (row.mode) bits.push(row.mode);
    // No separator glyphs: a dot left dangling at the end of a wrapped
    // line reads like a typo. Spacing alone separates the items.
    bits.forEach(function (bit) {
      var s = document.createElement('span');
      s.textContent = bit;
      meta.appendChild(s);
    });

    var summary = document.createElement('p');
    summary.className = 'wcard-summary';
    summary.textContent = row.summary || 'No description yet.';

    var foot = document.createElement('div');
    foot.className = 'wcard-foot';

    var price = document.createElement('span');
    price.className = 'price';
    price.textContent = row.price || (row.type || 'Workshop');

    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-soft btn-sm';
    edit.textContent = 'Edit';
    edit.addEventListener('click', function () { openEditor('workshops', row); });

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-danger btn-sm';
    del.textContent = 'Delete';
    del.addEventListener('click', function () { removeRow('workshops', row); });

    foot.appendChild(price);
    foot.appendChild(edit);
    foot.appendChild(del);

    body.appendChild(h3);
    if (bits.length) body.appendChild(meta);
    body.appendChild(summary);
    body.appendChild(foot);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function serviceCard(row) {
    var card = document.createElement('article');
    card.className = 'wcard';

    var media = document.createElement('div');
    media.className = 'wcard-media';
    var src = safeImage(row.image);
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', function () {
        img.remove();
        var fb = document.createElement('div');
        fb.className = 'fallback';
        fb.textContent = 'No image';
        media.appendChild(fb);
      });
      media.appendChild(img);
    } else {
      var fb2 = document.createElement('div');
      fb2.className = 'fallback';
      fb2.textContent = 'No image';
      media.appendChild(fb2);
    }

    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = row.number ? 'No. ' + row.number : 'Service';
    media.appendChild(badge);

    var body = document.createElement('div');
    body.className = 'wcard-body';

    var h3 = document.createElement('h3');
    h3.textContent = row.title || 'Untitled service';

    var summary = document.createElement('p');
    summary.className = 'wcard-summary';
    summary.textContent = row.text || 'No description yet.';

    var foot = document.createElement('div');
    foot.className = 'wcard-foot';

    var link = document.createElement('span');
    link.className = 'price';
    link.style.fontWeight = '500';
    link.style.color = 'var(--muted)';
    link.style.fontSize = '12.5px';
    link.textContent = row.published === false ? 'Hidden' : (row.link || '#');

    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-soft btn-sm';
    edit.textContent = 'Edit';
    edit.addEventListener('click', function () { openEditor('services', row); });

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-danger btn-sm';
    del.textContent = 'Delete';
    del.addEventListener('click', function () { removeRow('services', row); });

    foot.appendChild(link);
    foot.appendChild(edit);
    foot.appendChild(del);

    body.appendChild(h3);
    body.appendChild(summary);
    body.appendChild(foot);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function renderWorkshops() {
    var grid = $('workshops-grid');
    grid.textContent = '';

    var rows = sortByStart(state.workshops);
    var counts = { all: rows.length, upcoming: 0, ongoing: 0, completed: 0 };
    rows.forEach(function (r) { counts[statusOf(r)] += 1; });

    document.querySelectorAll('[data-count]').forEach(function (node) {
      node.textContent = counts[node.getAttribute('data-count')] || 0;
    });

    var q = state.query.trim().toLowerCase();
    var visible = rows.filter(function (r) {
      if (state.filter !== 'all' && statusOf(r) !== state.filter) return false;
      if (!q) return true;
      return (String(r.title || '') + ' ' + String(r.location || '') + ' ' + String(r.type || '')).toLowerCase().indexOf(q) !== -1;
    });

    if (!state.loaded.workshops) return;

    if (!visible.length) {
      renderState(grid,
        state.workshops.length ? 'Nothing matches this filter' : 'No workshops yet',
        state.workshops.length
          ? 'Try another status or clear the search.'
          : 'Add your first retreat, training or event — it appears here as a card.',
        null);
      if (!state.workshops.length) {
        var add = document.createElement('button');
        add.type = 'button';
        add.className = 'btn btn-primary btn-sm';
        add.textContent = '+ New workshop';
        add.addEventListener('click', function () { openEditor('workshops', null); });
        grid.querySelector('.state').appendChild(add);
      }
      return;
    }

    visible.forEach(function (row) { grid.appendChild(workshopCard(row)); });
  }

  function renderServices() {
    var grid = $('services-grid');
    grid.textContent = '';

    var rows = sortByOrder(state.services);
    var q = state.serviceQuery.trim().toLowerCase();
    var visible = rows.filter(function (r) {
      if (!q) return true;
      return (String(r.title || '') + ' ' + String(r.text || '')).toLowerCase().indexOf(q) !== -1;
    });

    if (!visible.length) {
      renderState(grid,
        rows.length ? 'Nothing matches that search' : 'No service cards yet',
        rows.length ? 'Try a different word.' : 'Add the cards that should appear in the homepage slider.',
        null);
      if (!rows.length) {
        var add = document.createElement('button');
        add.type = 'button';
        add.className = 'btn btn-primary btn-sm';
        add.textContent = '+ New service';
        add.addEventListener('click', function () { openEditor('services', null); });
        grid.querySelector('.state').appendChild(add);
      }
      return;
    }

    visible.forEach(function (row) { grid.appendChild(serviceCard(row)); });
  }

  function renderStats() {
    var counts = { total: state.workshops.length, upcoming: 0, ongoing: 0, completed: 0 };
    state.workshops.forEach(function (r) { counts[statusOf(r)] += 1; });
    Object.keys(counts).forEach(function (key) {
      var node = document.querySelector('[data-stat="' + key + '"]');
      if (node) node.textContent = counts[key];
    });
    renderOverview();
  }

  function renderOverview() {
    var grid = $('overview-grid');
    grid.textContent = '';

    if (!state.loaded.workshops) {
      var box = document.createElement('div');
      box.className = 'state';
      box.textContent = 'Workshops are unavailable right now — see the message under Workshops.';
      grid.appendChild(box);
      return;
    }

    var rows = sortByStart(state.workshops).filter(function (r) {
      return statusOf(r) !== 'completed';
    });

    if (!rows.length) {
      renderState(grid, 'Nothing scheduled', 'Add an upcoming workshop or retreat and it will show up here first.', null);
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn btn-primary btn-sm';
      add.textContent = '+ New workshop';
      add.addEventListener('click', function () { openEditor('workshops', null); });
      grid.querySelector('.state').appendChild(add);
      return;
    }

    rows.slice(0, 6).forEach(function (row) { grid.appendChild(workshopCard(row)); });
  }

  /* =========================================================
     Editor
     ========================================================= */

  var editing = { kind: 'workshops', rowId: null };

  function closeEditor() {
    $('editor').hidden = true;
    editing.rowId = null;
    banner($('editor-msg'), '', null);
  }

  function openEditor(kind, row) {
    var schema = SCHEMAS[kind];
    editing.kind = kind;
    editing.rowId = row ? row.$id : null;

    $('editor-title').textContent = row ? 'Edit ' + schema.noun : 'New ' + schema.noun;
    $('editor-save').textContent = row ? 'Save changes' : 'Create ' + schema.noun;
    banner($('editor-msg'), '', null);

    var wrap = $('editor-fields');
    wrap.textContent = '';

    schema.fields.forEach(function (field) {
      var value = row ? row[field.key] : field.type === 'checkbox' ? true : '';
      wrap.appendChild(fieldNode(field, value));
    });

    $('editor').hidden = false;
    var first = wrap.querySelector('input, select, textarea');
    if (first) first.focus();
  }

  function fieldNode(field, value) {
    var box = document.createElement('div');
    box.className = 'field' + (field.full ? ' full' : '');

    var id = 'fld-' + field.key;

    if (field.type === 'checkbox') {
      var rowEl = document.createElement('div');
      rowEl.className = 'field-row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.checked = value !== false;
      var lbl = document.createElement('label');
      lbl.setAttribute('for', id);
      lbl.style.textTransform = 'none';
      lbl.style.letterSpacing = '0';
      lbl.style.fontSize = '14px';
      lbl.style.fontWeight = '500';
      lbl.style.color = 'var(--ink)';
      lbl.textContent = field.label;
      rowEl.appendChild(cb);
      rowEl.appendChild(lbl);
      box.appendChild(rowEl);
      return box;
    }

    var label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = field.label;
    box.appendChild(label);

    var input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt;
        o.textContent = (field.labels && field.labels[opt]) || opt;
        input.appendChild(o);
      });
      var current = value == null ? '' : String(value);
      var matched = field.options.filter(function (o) { return o.toLowerCase() === current.toLowerCase(); });
      input.value = matched.length ? matched[0] : field.options[0];
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.maxLength = field.maxlength || 400;
      input.value = value == null ? '' : String(value);
      if (field.placeholder) input.placeholder = field.placeholder;
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.value = value == null ? '' : String(value);
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.type === 'number') input.min = '0';
    }

    input.id = id;
    input.setAttribute('data-key', field.key);
    if (field.required) input.required = true;
    box.appendChild(input);

    if (field.key === 'startDate') {
      var hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = 'Optional. With an end date, the card shows a range.';
      box.appendChild(hint);
    }

    if (field.key === 'image') {
      var preview = document.createElement('img');
      preview.className = 'preview';
      preview.alt = 'Selected image preview';
      if (value) {
        preview.src = safeImage(value);
        preview.style.display = preview.src ? 'block' : 'none';
      }
      input.addEventListener('input', function () {
        var src = safeImage(input.value);
        preview.src = src;
        preview.style.display = src ? 'block' : 'none';
      });
      preview.addEventListener('error', function () { preview.style.display = 'none'; });
      box.appendChild(preview);
    }

    return box;
  }

  function collectData(kind) {
    var schema = SCHEMAS[kind];
    var data = {};
    schema.fields.forEach(function (field) {
      var node = $('fld-' + field.key);
      if (!node) return;
      if (field.type === 'checkbox') {
        data[field.key] = !!node.checked;
      } else if (field.type === 'number') {
        var n = parseInt(node.value, 10);
        // Appwrite integer columns reject null here, so an empty box is 0.
        data[field.key] = isNaN(n) ? 0 : n;
      } else {
        data[field.key] = node.value.trim();
      }
    });
    return data;
  }

  $('editor-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var kind = editing.kind;
    var schema = SCHEMAS[kind];
    var data = collectData(kind);
    var btn = $('editor-save');
    btn.disabled = true;

    var missing = schema.fields.filter(function (f) {
      return f.required && !data[f.key];
    }).map(function (f) { return f.label; });

    if (missing.length) {
      banner($('editor-msg'), 'Please fill in: ' + missing.join(', ') + '.', 'error');
      btn.disabled = false;
      return;
    }

    var op = editing.rowId
      ? api.tablesDB.updateRow({ databaseId: DB, tableId: schema.table, rowId: editing.rowId, data: data })
      : api.tablesDB.createRow({ databaseId: DB, tableId: schema.table, rowId: window.Appwrite.ID.unique(), data: data });

    op.then(function () {
      banner($('global-msg'), schema.noun.charAt(0).toUpperCase() + schema.noun.slice(1) + (editing.rowId ? ' updated.' : ' created.'), 'ok');
      closeEditor();
      if (kind === 'workshops') loadWorkshops(); else loadServices();
    }).catch(function (err) {
      // Keep the sheet open with the typed values intact.
      banner($('editor-msg'), 'Save failed: ' + describeError(err, schema.noun), 'error');
      if (codeOf(err) === 401) {
        window.setTimeout(gate, 1200);
      }
    }).finally(function () {
      btn.disabled = false;
    });
  });

  $('editor-close').addEventListener('click', closeEditor);
  $('editor-cancel').addEventListener('click', closeEditor);
  $('editor').addEventListener('click', function (e) {
    if (e.target === $('editor')) closeEditor();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('editor').hidden) closeEditor();
  });

  function removeRow(kind, row) {
    var schema = SCHEMAS[kind];
    var name = row.title || row.$id;
    if (!window.confirm('Delete "' + name + '"? This cannot be undone.')) return;

    api.tablesDB.deleteRow({ databaseId: DB, tableId: schema.table, rowId: row.$id })
      .then(function () {
        banner($('global-msg'), 'Deleted "' + name + '".', 'ok');
        if (kind === 'workshops') {
          state.workshops = state.workshops.filter(function (r) { return r.$id !== row.$id; });
          renderWorkshops();
          renderStats();
        } else {
          state.services = state.services.filter(function (r) { return r.$id !== row.$id; });
          renderServices();
        }
      })
      .catch(function (err) {
        banner($('global-msg'), 'Delete failed: ' + describeError(err, schema.noun), 'error');
        if (codeOf(err) === 401) gate();
      });
  }

  /* =========================================================
     Views
     ========================================================= */

  var VIEWS = {
    overview: { title: 'Overview', sub: 'Everything running at the studio, at a glance.', newLabel: '+ New workshop' },
    workshops: { title: 'Workshops', sub: 'Retreats, trainings and events — past, present and planned.', newLabel: '+ New workshop' },
    services: { title: 'Services', sub: 'The cards in the homepage slider.', newLabel: '+ New service' }
  };

  function switchView(view) {
    state.view = view;
    ['overview', 'workshops', 'services'].forEach(function (name) {
      $('view-' + name).hidden = name !== view;
    });
    document.querySelectorAll('.adm-nav button').forEach(function (btn) {
      if (btn.getAttribute('data-view') === view) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    $('page-title').textContent = VIEWS[view].title;
    $('page-sub').textContent = VIEWS[view].sub;
    $('btn-new').textContent = VIEWS[view].newLabel;
    $('btn-new').hidden = false;
  }

  document.querySelectorAll('.adm-nav button').forEach(function (btn) {
    btn.addEventListener('click', function () { switchView(btn.getAttribute('data-view')); });
  });

  $('btn-new').addEventListener('click', function () {
    openEditor(state.view === 'services' ? 'services' : 'workshops', null);
  });

  document.querySelectorAll('[data-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.filter = chip.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      renderWorkshops();
    });
  });

  $('ws-search').addEventListener('input', function (e) {
    state.query = e.target.value;
    renderWorkshops();
  });

  $('sv-search').addEventListener('input', function (e) {
    state.serviceQuery = e.target.value;
    renderServices();
  });

  /* =========================================================
     Boot
     ========================================================= */

  gate();
})();
