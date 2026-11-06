/**
 * Contact form — Appwrite submission
 * ----------------------------------
 * The contact form used to POST back to index.html, so every enquiry
 * was discarded (audit finding B3/L1). This module posts the submission
 * to the `contact` table instead.
 *
 * Behaviour:
 *  - Validates in the browser, with messages announced through an
 *    aria-live status element under the button.
 *  - Posts straight to the Appwrite REST endpoint (no SDK on the home
 *    page), using the same public project ID the rest of the site uses.
 *  - On success: clears the form and confirms.
 *  - On failure: keeps the typed data (never wipes a lead), and shows a
 *    clear message. If a fallback address is configured in
 *    appwrite-config.js (`site.contactEmail`), an email link is offered
 *    so the enquiry is still recoverable.
 *
 * The table and its permissions must exist first — run
 * `node tools/setup-appwrite.mjs` (see README).
 */
(function () {
  'use strict';

  var cfg = window.APPWRITE_CONFIG || {};
  var db = (cfg.database && cfg.database.databaseId) || '';
  var tableId = (cfg.database && cfg.database.tables && cfg.database.tables.contact) || '';
  var fallbackEmail = (cfg.site && cfg.site.contactEmail) || '';

  var form = null;
  var status = null;
  var submitting = false;

  function setStatus(message, state, withEmailLink) {
    if (!status) return;
    status.textContent = '';
    status.hidden = false;
    status.setAttribute('data-state', state);

    var text = document.createElement('span');
    text.textContent = message;
    status.appendChild(text);

    if (withEmailLink && fallbackEmail) {
      var link = document.createElement('a');
      link.href = 'mailto:' + fallbackEmail;
      link.textContent = ' ' + fallbackEmail;
      status.appendChild(link);
    }
  }

  function clearStatus() {
    if (!status) return;
    status.textContent = '';
    status.hidden = true;
    status.removeAttribute('data-state');
  }

  function value(name) {
    var field = form.elements[name];
    return field && typeof field.value === 'string' ? field.value.trim() : '';
  }

  function validate(data) {
    if (data.name.length < 2) {
      return { field: 'name', message: 'Please enter your name.' };
    }
    if (!data.email && !data.phone) {
      return { field: 'email', message: 'Please add an email address or a phone number so we can reply.' };
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
      return { field: 'email', message: 'That email address does not look right.' };
    }
    return null;
  }

  function endpointUrl() {
    var base = String(cfg.endpoint || '').replace(/\/+$/, '');
    return (
      base +
      '/tablesdb/' + encodeURIComponent(db) +
      '/tables/' + encodeURIComponent(tableId) +
      '/rows'
    );
  }

  function submit(data) {
    return window
      .fetch(endpointUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': cfg.projectId,
        },
        credentials: 'omit',
        body: JSON.stringify({ rowId: 'unique()', data: data }),
      })
      .then(function (res) {
        if (res.ok) return res.json().catch(function () { return {}; });
        return res.json().catch(function () { return {}; }).then(function (body) {
          var error = new Error(body.message || 'Submission failed (' + res.status + ')');
          error.code = res.status;
          throw error;
        });
      });
  }

  function onSubmit(event) {
    event.preventDefault();
    if (!form || submitting) return;

    var data = {
      name: value('name'),
      phone: value('phone'),
      email: value('email'),
      date: value('date'),
      retreat: value('retreat'),
    };

    var problem = validate(data);
    if (problem) {
      setStatus(problem.message, 'error');
      var field = form.elements[problem.field];
      if (field && typeof field.focus === 'function') field.focus();
      return;
    }

    if (!cfg.endpoint || !cfg.projectId || !db || !tableId) {
      setStatus(
        'The enquiry form is not connected yet. Please contact us by email instead:',
        'error',
        true
      );
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    var label = button ? button.innerHTML : '';
    submitting = true;
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    setStatus('Sending…', 'pending');

    submit(data)
      .then(function () {
        form.reset();
        setStatus('Thank you — your message is on its way. We usually reply within one business day.', 'success');
      })
      .catch(function (err) {
        // 401/404 here almost always means the `contact` table or its
        // create permission has not been set up yet.
        var notReady = err && (err.code === 401 || err.code === 403 || err.code === 404);
        setStatus(
          notReady
            ? 'The enquiry form is not connected yet. Please contact us by email instead:'
            : 'Sorry, your message could not be sent. Please try again, or email us:',
          'error',
          true
        );
        if (window.console && console.warn) {
          console.warn('[Contact] Submission failed:', err && err.message ? err.message : err);
        }
      })
      .then(function () {
        submitting = false;
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
          if (label) button.innerHTML = label;
        }
      });
  }

  function init() {
    form = document.querySelector('[data-contact-form]');
    if (!form) return;
    status = form.querySelector('.form-status');
    form.addEventListener('submit', onSubmit);
    form.addEventListener('input', function () {
      if (status && !status.hidden && status.getAttribute('data-state') === 'error') {
        clearStatus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
