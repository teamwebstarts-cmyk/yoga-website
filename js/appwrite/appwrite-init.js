/**
 * Appwrite SDK initialization — Yogava landing page
 * --------------------------------------------------
 * Consumes the .env-driven values in appwrite-config.js (generated
 * by _tools/sync-appwrite-env.py), initializes the Appwrite Web SDK
 * (loaded globally via CDN as `Appwrite`), and exposes everything
 * future feature code needs on `window.yogavaAppwrite`:
 *
 *   client     — Appwrite Client (endpoint/project from .env)
 *   account    — Account service (auth)
 *   tablesDB   — TablesDB service (guarded for older SDK builds)
 *   databaseId — APPWRITE_DATABASE_ID from .env ('' until set)
 *   tables     — named table IDs from the generated config
 *
 * This file performs NO API calls on page load — it only wires up
 * the client. Authentication, database reads/writes, and form
 * handling are out of scope for setup and must be added later
 * against `window.yogavaAppwrite`.
 *
 * Debug logging is enabled only on localhost hostnames so
 * production visitors get no console noise.
 */
(function () {
  'use strict';

  var cfg = window.APPWRITE_CONFIG;

  if (!cfg || !cfg.endpoint || !cfg.projectId) {
    console.error(
      '[Appwrite] Missing config — run: python _tools/sync-appwrite-env.py ' +
      '(generates js/appwrite/appwrite-config.js from .env)'
    );
    return;
  }

  if (typeof window.Appwrite === 'undefined') {
    console.error(
      '[Appwrite] SDK not loaded. Ensure the appwrite CDN <script> tag ' +
      'appears before this file in index.html.'
    );
    return;
  }

  // Initialize the Appwrite web client (.env -> config -> here).
  var client = new window.Appwrite.Client()
    .setEndpoint(cfg.endpoint)
    .setProject(cfg.projectId);

  // Service handles, created up front (no network calls).
  var services = {
    client: client,
    account: new window.Appwrite.Account(client),
  };

  // TablesDB service — guarded so older SDK builds fail gracefully.
  if (typeof window.Appwrite.TablesDB !== 'undefined') {
    services.tablesDB = new window.Appwrite.TablesDB(client);
  }

  // Database identifiers consumed from .env via the generated config.
  services.databaseId = (cfg.database && cfg.database.databaseId) || '';
  services.tables = (cfg.database && cfg.database.tables) || {};

  // Expose for future feature code, e.g.
  //   window.yogavaAppwrite.tablesDB.listRows({
  //     databaseId: window.yogavaAppwrite.databaseId,
  //     tableId: window.yogavaAppwrite.tables.contact
  //   })
  window.yogavaAppwrite = services;

  // Local-only debug line (never runs for production visitors).
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  if (isLocal && window.console && window.console.log) {
    console.log(
      '[Appwrite] Initialized for project ' + cfg.projectId +
      ' at ' + cfg.endpoint +
      ' (databaseId: ' + (services.databaseId || 'not set') + ')'
    );
  }
})();
