# Runtime Test Report

**Date:** 2026-11-06  
**Branch:** `landing-page-update`  
**Scope:** local homepage, dashboard, privacy/404 pages, current Appwrite configuration and anonymous access.  
**Changes made:** this report only. No application/configuration files were modified, no Appwrite schema changes were sent, and no contact/test rows were created.

## Summary

**Overall result: NOT PASS / BLOCKED.** The static server and local routes work, the Appwrite service host is reachable, and the schema setup script's dry-run succeeds. However, the live Appwrite project returns `402 team_read_only` for every tested table; the public homepage throws a JavaScript initialization error; and headless browser styling was inconsistent between runs. Admin login, CRUD, and contact persistence could not be verified and should not be treated as working.

## Results

| Check | Result | Notes |
|---|---|---|
| Local HTTP server | PASS | Started at `http://127.0.0.1:8765/`. |
| Homepage, dashboard, privacy, 404 page, robots, sitemap routes | PASS | Each requested route returned HTTP 200 from the local static server. Unknown-path/host-specific 404 fallback was not tested. |
| Local Appwrite config alignment | PASS | `.env` project and database identifiers match the public client config. Only match/presence results were printed; no secret values were displayed. |
| Appwrite host health | PARTIAL | `/v1/health/version` returned 200. `/v1/health` returned 401 `general_unauthorized_scope`; this endpoint did not establish the project/table status. Local-origin CORS headers were present on table responses. |
| Guest services/workshops/contact table reads | BLOCKED | All three returned HTTP 402 `team_read_only`. Public services cannot load; admin-only tables cannot be distinguished/tested while the project is in this state. |
| Appwrite schema `--dry-run` | PASS | `node tools/setup-appwrite.mjs --dry-run` printed the planned database, table, column, index, and bucket operations. Dry-run sent no requests. The live schema setup was not run. |
| Project-owned JS syntax | PASS | `node --check` passed for `js/appwrite/*.js`, `js/theme/*.js`, and `tools/*.mjs`. |
| Homepage JavaScript runtime | FAIL | Chromium reported `TypeError: $(...).appear is not a function` from `js/theme/script.js` at the count-box initializer (around line 825). `appear.js` was served with HTTP 200, but `jQuery.fn.appear` was undefined during normal page initialization. Evaluating the plugin source manually attached it; the cause of the normal-load discrepancy remains unresolved. |
| Browser console | FAIL | The above uncaught exception was observed. No other stable page-level error result was established. |
| Desktop visual rendering | NOT VERIFIED | In a fresh headless context the stylesheet URLs returned 200, but the page appeared unstyled, the preloader remained visible, and the document reported horizontal overflow. CSSOM access to local theme rules raised a `SecurityError`. Earlier mobile capture was styled. Headless Chromium emitted environment/flag errors, so this is not a reliable visual pass or a conclusive production-layout defect. |
| Mobile horizontal overflow | PARTIAL | One 390px capture measured document width equal to viewport; a later context retained an unexpected 1560px viewport/document width. Repeat in a normal browser before accepting responsive behavior. |
| Broken images | PARTIAL | Initial DOM sampling counted lazy images before they loaded. Server logs show referenced local assets returning 200, but a complete post-scroll image-load check was not completed. |
| Dashboard authentication and CRUD | NOT TESTED | No credentials were entered. Anonymous startup showed the sign-in form; account lookup returned expected 401 without a session. Project read-only state also prevents meaningful database CRUD verification. |
| Contact form persistence | NOT TESTED | Form was not submitted; this would create personal data in the live project. With table requests returning 402, persistence cannot currently be confirmed. |

## Appwrite Calls Made

Only unauthenticated health and row-read requests were made. No API key was sent. The tested row endpoints were:

- `services` rows: HTTP 402 `team_read_only`
- `workshops` rows: HTTP 402 `team_read_only`
- `contact` rows: HTTP 402 `team_read_only`

No login, write, delete, schema-creation, storage-upload, or MFA challenge was attempted. The same 402 state is documented in [PROJECT-STATUS.md](PROJECT-STATUS.md#L125).

## Recommended Next Checks

1. Resolve the Appwrite team's read-only/billing status, then retest anonymous services reads and admin-only table permissions. Run the schema script only after confirming the target project and reviewing the operations; its dry-run is not proof of API compatibility or existing permissions.
2. Fix/understand the `appear` plugin initialization failure, then repeat browser console and animation checks. Do not treat the current desktop screenshot as a visual pass.
3. In a normal browser, verify the homepage at desktop and mobile widths, scroll through lazy-loaded sections, and check the dashboard's signed-out state.
4. After access is restored, use a dedicated test admin and disposable test data to test login/MFA, service/workshop CRUD, public service rendering, and contact submission. Delete test data afterward and verify the denied operations with a non-admin account.
5. Confirm deployment-specific redirects, headers, HTTPS, and 404 behavior on the actual hosting platform; local Python static hosting does not validate those settings.