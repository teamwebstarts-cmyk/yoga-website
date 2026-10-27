/**
 * Appwrite configuration - Yogava landing page
 * ---------------------------------------------
 * AUTO-GENERATED from .env by _tools/sync-appwrite-env.py.
 * Do not edit by hand - edit .env, then re-run:
 *
 *     python _tools/sync-appwrite-env.py
 *
 * SECURITY: Only public, client-safe values are written here.
 * API keys, API secrets, and privileged credentials must never
 * appear in this file or any other frontend code. Browser access
 * is governed by the platforms (hostnames) registered on the
 * Appwrite project.
 */
window.APPWRITE_CONFIG = {
  // Appwrite Cloud endpoint (NYC region).
  endpoint: 'https://nyc.cloud.appwrite.io/v1',

  // Appwrite project ID (Console > Settings > Project ID).
  projectId: '6ae04d6900049efeae83',

  // Database identifiers for future integrations.
  // Leave as empty strings until a database/table is created;
  // set them here (via .env) when that happens.
  database: {
    databaseId: '', // e.g. 'yogava-main'
    tables: {
      // tableId: '' - reserved for future tables, e.g. contact submissions
    },
  },
};
