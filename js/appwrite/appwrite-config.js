/**
 * Appwrite configuration
 * ----------------------
 * Public, client-safe identifiers only. Everything in this file is
 * visible to every visitor, which is expected: an Appwrite project ID
 * and database/table IDs are not secrets. Authorisation is enforced by
 * the table permissions in the Appwrite console, never by these values.
 *
 * Never put an API key here. The key used for setup lives in the
 * git-ignored `.env` file and is only read by tools/setup-appwrite.mjs.
 *
 * Note: earlier versions of this file claimed to be auto-generated from
 * .env by `_tools/sync-appwrite-env.py`. That script does not exist in
 * this repository, so the claim was removed — this file is maintained
 * by hand (audit finding A2/M3).
 */
window.APPWRITE_CONFIG = {
  // Appwrite Cloud endpoint (NYC region).
  endpoint: 'https://nyc.cloud.appwrite.io/v1',

  // Appwrite project ID (Console > Settings > Project ID).
  projectId: '6ae04d6900049efeae83',

  database: {
    databaseId: 'yogava-main',
    tables: {
      // Public read, admin write. Rendered by js/appwrite/services-data.js.
      services: 'services',
      // Guest create only, admin read. Used by js/appwrite/contact-form.js.
      contact: 'contact',
    },
  },

  site: {
    // Shown as a fallback link when the contact form cannot submit.
    // Leave empty until the real inbox exists.
    contactEmail: '',
  },
};
