#!/usr/bin/env node
/**
 * Appwrite schema setup — Lotus U Yoga
 * ------------------------------------
 * Creates/repairs the database objects the website expects:
 *
 *   services table   public read, admin-only writes  (homepage slider)
 *   contact table    public create, admin read       (enquiry form)
 *   media bucket     public read, admin write        (future image uploads)
 *
 * Safe to re-run: existing tables, columns and indexes are detected and
 * skipped (Appwrite answers 409 for duplicates).
 *
 * Usage:
 *   1. Put APPWRITE_API_KEY in .env (an API key with tables.read,
 *      tables.write, storage.read and storage.write scopes).
 *   2. node tools/setup-appwrite.mjs
 *      node tools/setup-appwrite.mjs --dry-run
 *
 * !!! UNTESTED: the target project is in read-only mode ("team_read_only",
 * 402) as of 2026-11-06, so this script could not be executed even once.
 * Restore write access in the Appwrite console, then run it and check the
 * output before trusting it. It only creates objects; it never deletes.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

/* ---------- env ---------- */

function loadEnv() {
  const file = resolve(root, '.env');
  let raw = '';
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    console.error('No .env found at ' + file);
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

const env = loadEnv();
const ENDPOINT = (env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1').replace(/\/+$/, '');
const PROJECT = env.APPWRITE_PROJECT_ID;
const KEY = env.APPWRITE_API_KEY;
const DATABASE = env.APPWRITE_DATABASE_ID || 'yogava-main';

if (!PROJECT || !KEY) {
  console.error('APPWRITE_PROJECT_ID and APPWRITE_API_KEY are required in .env');
  process.exit(1);
}

/* ---------- helpers ---------- */

async function api(method, path, body) {
  const url = ENDPOINT + path;
  if (dryRun) {
    console.log('  [dry-run] ' + method + ' ' + path);
    return { ok: true, status: 200, body: {} };
  }
  const res = await fetch(url, {
    method,
    headers: {
      'X-Appwrite-Project': PROJECT,
      'X-Appwrite-Key': KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { message: text };
  }
  return { ok: res.ok, status: res.status, body: parsed };
}

let problems = 0;

async function step(label, method, path, body) {
  const res = await api(method, path, body);
  if (res.ok) {
    console.log('  ✓ ' + label);
    return true;
  }
  if (res.status === 409) {
    console.log('  = ' + label + ' (already exists)');
    return true;
  }
  if (res.status === 402) {
    console.log('  ✗ ' + label + ' — project is in READ-ONLY mode (402).');
    console.log('    Fix organisation billing in the Appwrite console, then re-run.');
    problems += 1;
    return false;
  }
  if (res.status === 401 || res.status === 403) {
    console.log('  ✗ ' + label + ' (' + res.status + ') — API key lacks scope: ' + (res.body.message || ''));
    problems += 1;
    return false;
  }
  console.log('  ✗ ' + label + ' (' + res.status + ') — ' + (res.body.message || 'unknown error'));
  problems += 1;
  return false;
}

const ANY = (action) => action + '("any")';
const ADMIN = (action) => action + '("label:admin")';

/* ---------- database ---------- */

async function ensureDatabase() {
  console.log('\nDatabase: ' + DATABASE);
  await step('database', 'POST', '/databases', { databaseId: DATABASE, name: 'Lotus U Yoga' });
}

async function ensureTable(id, name, permissions, rowSecurity) {
  console.log('\nTable: ' + id);
  await step('table "' + id + '"', 'POST', '/tablesdb/' + DATABASE + '/tables', {
    tableId: id,
    name,
    permissions,
    rowSecurity,
  });
}

async function ensureString(table, key, size, required = false) {
  await step(
    'column ' + table + '.' + key + ' (string ' + size + ')',
    'POST',
    '/tablesdb/' + DATABASE + '/tables/' + table + '/columns/string',
    { key, size, required, array: false, encrypt: false }
  );
}

async function ensureBoolean(table, key, defaultValue) {
  await step(
    'column ' + table + '.' + key + ' (boolean)',
    'POST',
    '/tablesdb/' + DATABASE + '/tables/' + table + '/columns/boolean',
    { key, required: false, array: false, default: defaultValue }
  );
}

async function ensureIndex(table, key, attributes) {
  await step(
    'index ' + table + '.' + key,
    'POST',
    '/tablesdb/' + DATABASE + '/tables/' + table + '/indexes',
    { key, type: 'key', attributes, orders: attributes.map(() => 'ASC') }
  );
}

async function main() {
  console.log('Endpoint: ' + ENDPOINT);
  console.log('Project:  ' + PROJECT);
  if (dryRun) console.log('Mode:     dry run (no requests sent)');

  await ensureDatabase();

  /* ---- services: homepage slider ---- */
  await ensureTable('services', 'Services', [ANY('read'), ADMIN('create'), ADMIN('update'), ADMIN('delete')], false);
  await ensureString('services', 'number', 16, true);
  await ensureString('services', 'title', 120, true);
  await ensureString('services', 'line2', 120);
  await ensureString('services', 'text', 1000);
  await ensureString('services', 'image', 255);
  await ensureString('services', 'link', 255);
  await ensureBoolean('services', 'published', true);
  await ensureIndex('services', 'number_idx', ['number']);

  /* ---- contact: enquiry form ---- */
  await ensureTable('contact', 'Contact enquiries', [ANY('create'), ADMIN('read'), ADMIN('update'), ADMIN('delete')], false);
  await ensureString('contact', 'name', 80, true);
  await ensureString('contact', 'phone', 30);
  await ensureString('contact', 'email', 120);
  await ensureString('contact', 'date', 40);
  await ensureString('contact', 'retreat', 80);
  await ensureString('contact', 'status', 20);

  /* ---- media bucket (for dashboard image uploads) ---- */
  console.log('\nStorage bucket: media');
  await step('bucket "media"', 'POST', '/storage/buckets', {
    bucketId: 'media',
    name: 'Site media',
    permissions: [ANY('read'), ADMIN('create'), ADMIN('update'), ADMIN('delete')],
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 10 * 1024 * 1024,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'],
    compression: 'none',
    encryption: true,
    antivirus: true,
  });

  console.log('\n' + (problems ? problems + ' step(s) failed.' : 'All steps completed.'));
  if (problems) process.exitCode = 1;
}

main().catch((err) => {
  console.error('\nUnexpected failure:', err);
  process.exitCode = 1;
});
