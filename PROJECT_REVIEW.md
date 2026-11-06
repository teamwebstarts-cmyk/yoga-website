# Project Readiness Review

**Project:** current Yogava template clone, intended to become Lotus U Lotus Yoga  
**Review date:** 2026-11-06  
**Scope:** tracked files on `main`; static home page, admin dashboard, Appwrite browser integration, bundled theme/vendor code, local assets, setup notes.  
**Purpose:** identify behind-the-scenes readiness, security, rights, operational, and content gaps before branding and launch. This is a technical due-diligence review, not legal advice or a browser-based certification.

## Executive Assessment

This repository is a polished-looking static template scaffold with a small Appwrite service-card editor. It is not yet a complete Lotus U Lotus Yoga website or booking system. The homepage, forms, content, identity, asset rights, and deployed Appwrite security configuration all still need decisions or implementation.

**Heuristic production-readiness score: 2/10.** This score means “ready to launch as the intended branded business site,” not “quality of the visual design.” The score is low mainly because rights are unverified, the remote authorization rules cannot be audited from the repository, and the customer-facing booking/contact workflows do not submit anywhere.

| Area | Score | Assessment |
|---|---:|---|
| Visual scaffold | 4/5 | Existing structure and styles are established; README reports pixel-comparison work, but it could not be independently replayed in this checkout. |
| Rights and provenance | 0/5 | Several files explicitly require commercial or membership licensing; no proof of entitlement or asset provenance is tracked. |
| Appwrite security/reproducibility | 2/5 | Client flow exists, but actual ACLs, schema, MFA provisioning, and production project settings are external and unverified. |
| Customer workflows | 1/5 | Service cards can be edited; booking, contact submission, search, and many destinations are placeholders. |
| Accessibility and SEO | 1/5 | Missing semantic headings/labels and metadata; numerous non-descriptive image alternatives and placeholder links. |
| Testing and operations | 2/5 | Owned JavaScript parses and literal HTML asset paths exist, but no tracked test/build/CI setup or browser binary is available. |

**Release recommendation:** do not publish this copy as the real business site until rights and Appwrite permissions are confirmed, demo identity/content is removed, and all public forms/links have intentional behavior.

## What Is Here

- `index.html` is a single static landing page based on the Yogava yoga/wellness template. It contains the template's sections, images, text, animations, pricing, testimonials, gallery, and footer.
- `dashboard.html` is a separate static admin screen. It creates, edits, lists, and deletes rows in one Appwrite `services` table. It is not a general site CMS and has no media upload, booking management, contact inbox, or page editor.
- `js/appwrite/services-data.js` reads public service rows and replaces the homepage slider when it receives non-empty data. Otherwise, it keeps the hardcoded cards in the HTML.
- Appwrite authentication and table operations run directly from the browser. The endpoint, project ID, database ID, and table ID are public client configuration; no Appwrite API key is present in the tracked browser code. Those IDs are not secrets, but they must point to the intended project.
- Most layout, style, and animations live in large template/theme files. The project-specific dashboard and Appwrite code are separate, which gives a reasonable place for future integration work without changing the layout.

## Positive Findings

- Project-owned JavaScript files pass `node --check`.
- Static inspection found no duplicate IDs in either HTML page and no missing local paths referenced directly by the HTML.
- Dashboard table text is inserted using `textContent` and DOM nodes rather than HTML strings. The public service renderer escapes text fields before building markup.
- The Appwrite API key is not embedded in tracked frontend code. The `.env` file is absent from this checkout and excluded by `.gitignore`.
- The homepage retains static service cards if Appwrite is unavailable. This is resilient for display, but it can also mask stale demo content; see findings below.
- Bootstrap and several other bundled libraries retain permissive-license notices. That is useful provenance evidence, though it does not clear the commercial/template assets.

## Release Blockers

### R1. Rights to the template, plugins, fonts, and images are unverified

**Severity: release blocker.** The source code itself contains restrictive licensing signals:

- The theme header says `License: copyright commercial` in [css/theme/style.css](css/theme/style.css#L1).
- The included Font Awesome file identifies itself as Font Awesome Pro and a commercial license in [css/vendor/fontawesome.css](css/vendor/fontawesome.css#L2).
- Fancybox says GPLv3 for open-source use or a commercial license for commercial use in [js/vendor/jquery.fancybox.js](js/vendor/jquery.fancybox.js#L3).
- SplitText and ScrollSmoother have embedded notices requiring an active Club GreenSock membership in [js/vendor/SplitText.min.js](js/vendor/SplitText.min.js#L5) and [js/vendor/gsap-scroll-smoother.js](js/vendor/gsap-scroll-smoother.js#L5). SplitText is actively used by [js/theme/script.js](js/theme/script.js#L278) and [js/theme/custom-gsap.js](js/theme/custom-gsap.js#L13). ScrollSmoother appears to be shipped but not called by the project code.
- The README says the page was rebuilt from the source site's HTML, CSS, JS, images, and fonts in [README.md](README.md#L3). Images, logos, and local font files have no per-asset rights inventory or purchase records in this repository. The README's source URL and the ThemeMascot references in the theme do not establish the license chain.
- There is no tracked root license, notice bundle, template purchase receipt, Font Awesome entitlement, GreenSock membership proof, Fancybox commercial license, or image/font provenance record.

Scraping a page from the public internet does not itself grant rights to republish its source code, design assets, photography, fonts, or paid plugins. A personal brand or non-monetized launch does not automatically override the specific licenses. This review cannot determine whether the owner already holds an applicable license.

**Before launch:** identify the original template/vendor and the license for this exact end product; retain evidence of the purchase/terms; confirm the Font Awesome and GreenSock entitlements for the bundled versions; decide whether Fancybox use is compliant with GPLv3 or requires its commercial license; and clear every photo, logo, icon font, and display font. If rights cannot be established, replace those components with licensed alternatives while preserving the approved layout. Maintain a simple asset/dependency manifest with source, license, proof, and replacement status.

### R2. Appwrite server-side access rules cannot be verified from this repository

**Severity: release blocker until verified in the live Appwrite project.** The `isAdmin()` check in [js/appwrite/dashboard.js](js/appwrite/dashboard.js#L82) only controls which screen the browser displays. A user can modify client-side JavaScript; only Appwrite's server-side table/row permissions can protect writes. The README claims anonymous read and admin-only create/update/delete in [README.md](README.md#L20), but the repository contains no versioned Appwrite schema, permissions, project bootstrap, or deployable policy configuration.

The dashboard comments also claim email MFA is provisioned as a backend default, but the bootstrap tool referenced by [js/appwrite/dashboard.js](js/appwrite/dashboard.js#L13) is not tracked or present in this checkout. This review has no credentials or access to the live Appwrite Console, so neither the ACL claim nor mandatory MFA has been independently confirmed.

**Before launch:** verify the production database/table permissions directly in Appwrite: anonymous users may read only intended public service content; create/update/delete require the admin role at the server; row security/default permissions do not accidentally widen access; and every admin account has MFA enforced server-side. Verify the deployed hostname is registered as an Appwrite platform and test both allowed and denied operations with separate public, non-admin, and admin accounts. Treat the browser role check as UX only.

### R3. Admin-editable service links are not restricted to safe URL schemes

**Severity: high.** The dashboard accepts a free-form link in [dashboard.html](dashboard.html#L98), and [js/appwrite/services-data.js](js/appwrite/services-data.js#L67) places the escaped value into an anchor `href`. HTML escaping prevents quote/markup injection but does not reject executable URL schemes. If an unsafe value is stored, a visitor who clicks the public service link could execute script in the site's origin. The admin-only write path reduces who can introduce the value but does not make the public sink safe against a compromised account, accidental input, or future import workflow.

**Fix:** validate on both write and render. Accept only relative same-site paths and explicitly approved `https:` destinations (and only add `mailto:`/`tel:` if required). Reject all other schemes and render no clickable link for invalid/empty values. Apply the same rule in Appwrite-side validation or the trusted write path, not only in the browser UI.

## High-Priority Product and Data Gaps

### R4. Booking and contact are not connected to a backend

**Severity: high for launch.** The homepage form submits to `#` in [index.html](index.html#L918); there is no handler or API. The README acknowledges this in [README.md](README.md#L78). The visible “Book Now” action also points to `#` in [index.html](index.html#L111). The form currently has no associated labels, uses plain text for the date, repeats the `name` field name for the date and retreat values, and makes only the name required. The search form posts to the static page and has no search implementation.

The dashboard does not handle bookings or contact submissions. Before collecting real names, email addresses, phone numbers, or appointment requests, decide where that data goes, who can access it, how long it is retained, how users are informed, and how requests/errors are handled. Add a privacy notice and applicable data-handling disclosures for the actual operating region. Do not silently leave a non-working form on a live site.

### R5. The environment/setup path is not reproducible from this checkout

**Severity: high for deployment and maintenance.** [js/appwrite/appwrite-config.js](js/appwrite/appwrite-config.js#L15) says it is generated from `.env`, but its database/table IDs are hardcoded at [js/appwrite/appwrite-config.js](js/appwrite/appwrite-config.js#L27). [.env.example](.env.example#L26) leaves the database/table values blank and points to `_tools/sync-appwrite-env.py`; the generator, `.env`, `_tools/`, original snapshot, and screenshots are absent here. `.gitignore` excludes `_tools/`, `_original.html`, `.env`, and `_screenshots/` in [.gitignore](.gitignore#L1).

Static hosting does not automatically inject host environment variables into browser JavaScript. Changing environment variables will not update `APPWRITE_CONFIG` unless a build/deploy step generates a client config. New maintainers cannot recreate the claimed bootstrap process from tracked files, and the README describes files and verification evidence that are not in this checkout.

**Fix:** choose one documented configuration model: either a checked-in, explicitly public per-environment config file with a safe deployment replacement step, or a small build step that generates it from public variables. Never place the API key in generated browser code. Version the schema/setup/policy scripts (with secrets excluded) or document exact console steps and verification. Update README claims to match the branch.

### R6. Empty or large service datasets can diverge from what the dashboard shows

**Severity: medium-high.** `render()` in [js/appwrite/services-data.js](js/appwrite/services-data.js#L103) returns without changing the HTML when Appwrite successfully returns zero rows. Deleting all rows in the dashboard therefore leaves the five static sample cards visible on the public page. On network/configuration failure, the same fallback behavior is intentional, but the user gets only a console warning. Also, the public query caps results at 12 in [js/appwrite/services-data.js](js/appwrite/services-data.js#L21), while the dashboard does not apply the same cap or offer pagination. Entries beyond the public limit can be editable in the dashboard but invisible on the site.

**Fix:** distinguish “request failed” from “request succeeded with no rows”; show an intentional empty state or clear the slider for the latter. Decide whether fallback cards are suitable for production. Give the dashboard and public site the same enforced maximum/pagination behavior, and validate number formatting/order (the number is currently free-form text).

## Additional Findings

### Identity and content are still template/demo content

The page title is still the Yogava template title in [index.html](index.html#L5); the visible logos are template assets; the dashboard title and code also say Yogava. The page includes template contact numbers/emails, generic address/hours, example social links, unverified testimonials and ratings, placeholder prices, generic claims, and service descriptions. Replace all with approved Lotus U Lotus Yoga identity and accurate business facts before indexing or advertising the page. Be particularly careful that the static service fallback is not left with demo content after the Appwrite rows are changed.

### Many user-facing links are inert

Static inspection counted 62 homepage anchors with `href="#"`, including navigation, “Book Now,” appointment, pricing, blog, and social links. Clicking them usually jumps to the top or does nothing. Some secondary template pages are intentionally out of scope per the README, but the primary business actions still need destinations, working section anchors, or removal until implemented.

### Homepage semantics, accessibility, and SEO need work

- The homepage's visual H1 is a `div` with class `h1`, not an `<h1>`; there is no `<main>`, meta description, canonical URL, Open Graph metadata, sitemap, or homepage robots policy. Its current title is template text.
- The contact inputs rely on placeholders instead of associated `<label>` elements. The tab controls have no tab roles/selected-state semantics; mobile menu toggles and slider arrows include non-button elements. Confirm keyboard operation and screen-reader state for the actual flows.
- 98 of 118 homepage `<img>` elements have no non-empty alt text. Some are decorative and should remain hidden from assistive technology; meaningful yoga, instructor, testimonial, and article imagery needs contextual alternatives.
- Bootstrap and Font Awesome include limited reduced-motion rules, but no project-level `prefers-reduced-motion` handling was found for GSAP/Lenis effects or the continuous marquee. Add a reduced-motion behavior for those features without changing the default visual design.
- Markup includes a misspelled `<seciton>` gallery wrapper and extra closing `</i>` tags in [index.html](index.html#L347) and [index.html](index.html#L1029). Browsers recover, but these should be corrected and validated.

### Bundled jQuery UI stylesheet is corrupted

**Severity: medium, latent on the current homepage.** [css/vendor/jquery-ui.css](css/vendor/jquery-ui.css#L9) contains systematic substitutions such as `.um-helper-hidden`, `dmsplay`, and `accordmon`, while the matching JS uses `.ui-*` classes. Its selectors/properties do not match jQuery UI's generated markup, so widgets such as a future date picker/dialog will not receive their expected styles. The homepage currently has no jQuery UI widget, so this is not confirmed as a current visual regression. The README's sprite-only note does not describe this stylesheet corruption.

**Fix:** replace it with a verified upstream stylesheet matching the bundled jQuery UI version, or remove both jQuery UI assets if the site will not use them. Do not rely on the current file for a booking date picker.

### Asset and runtime performance are not launch-checked

Local assets total approximately 12 MB of images and 9.5 MB of fonts; several images are around 0.5–1 MB. The homepage has more than 100 image elements and no `loading="lazy"`, `srcset`, or explicit image dimensions in the markup. The theme stylesheet imports three Google font families through CSS `@import`; the dashboard also loads Appwrite from jsDelivr. These add third-party availability, privacy, and performance dependencies. There are no Subresource Integrity hashes, Content Security Policy, or hosting/security-header configuration in the repository.

A relative-URL scan found 80 CSS resource references with no matching local file: 71 in the shared all-pages theme CSS, seven in the corrupted jQuery UI CSS, and two legacy medical-icon `.eot` fallbacks. Many theme references appear to belong to template variants not present in `index.html`, so this count does not mean 80 requests break on the current page. Triage rules used by this page, remove dead theme references only if safe, and verify in a real browser/network log. Literal asset paths in the HTML did resolve.

### Dashboard operational edge cases

- The logout handler ignores `deleteSession()` failure and always reports “Signed out” in [js/appwrite/dashboard.js](js/appwrite/dashboard.js#L198). If the request fails while the session remains valid, the UI can mislead the operator; show an error and do not claim server logout succeeded.
- A non-admin authenticated user is sent back to the login view, but the code does not explicitly delete that session. This is not a substitute for server authorization, but clearing or accurately displaying the session state would avoid confusing refresh behavior.
- Deletes are irreversible from the UI; there is confirmation but no undo/export. Establish backups and a recovery path for Appwrite rows.
- Image fields accept arbitrary strings and show them as `<img src>` in both the admin and public page. Restrict to approved local asset paths or a controlled upload/storage host to avoid broken links and third-party tracking requests.

## Dependency and Privacy Notes

- Google Fonts are requested from Google Fonts in [css/theme/style.css](css/theme/style.css#L32); Appwrite SDK is requested from jsDelivr in [dashboard.html](dashboard.html#L119); service data is requested from Appwrite Cloud. Decide whether those third parties and their data transfers are acceptable, document them in the privacy notice as appropriate, and have a self-host/fallback policy if availability matters.
- The public page's service table is designed to be anonymously readable. Keep only publishable business content there. Do not add inquiries, customer details, unpublished notes, or admin-only data to that table.
- No analytics or tracking implementation was found in the tracked app code. External font/CDN/Appwrite requests still create third-party network requests.
- No package manifest, lockfile, test runner, lint configuration, CI workflow, or hosting configuration is tracked. The vendored source headers provide some dependency identity/version information, but there is no automated license/SBOM inventory.

## Validation Performed and Limits

- `node --check` passed for project-owned `js/appwrite/*.js` and `js/theme/*.js`.
- A standard-library HTML scan found no duplicate IDs and all literal HTML `src`/`href` asset paths resolved locally. It counted 62 `href="#"` anchors and 98 images without non-empty alt text.
- CSS local URL scan found 80 unresolved references across the full theme/vendor stylesheets; active-page impact is not established by static scanning alone.
- IDE diagnostics reported no errors in the earlier check. No browser binary, `.env`, Appwrite credentials, live Appwrite policy export, generator script, or automated test suite was available. Therefore interactive behavior, responsive rendering, accessibility, actual MFA enforcement, production ACLs, and real network requests were not independently tested.
- The README's pixel-diff and CDP claims could not be reproduced because its original snapshot, screenshots, and verification tooling are not present on this branch.

## Recommended Order of Work

1. **Rights gate:** verify template/plugin/font/image licenses. Replace anything without clear permission. Keep the records/attributions needed for those licenses.
2. **Security gate:** inspect and test Appwrite production permissions, row security, MFA, domains, and recovery. Store reproducible setup without exposing API keys. Add strict service link/image validation.
3. **Brand/content pass:** replace Yogava identity, demo copy, prices, testimonials, contact details, logos, and images with approved Lotus U Lotus Yoga materials. Preserve the current section structure and visual classes.
4. **Workflow pass:** connect booking/contact/search to the chosen services, define consent/privacy/retention, and ensure the dashboard scope matches the intended workflow. Fix empty/over-limit service behavior.
5. **Quality gate:** restore/fix or remove the broken jQuery UI stylesheet, correct markup and accessible names/roles, add metadata, optimize images/fonts, and configure deployment headers/CSP/SRI as appropriate.
6. **Repeatable QA:** add a small automated asset/link/HTML/JS check, then verify the actual production build in desktop and mobile browsers with keyboard, screen reader, reduced-motion, network, and Appwrite role tests.

## Bottom Line

The visual scaffold can be retained; there is no need to redesign it to address the major concerns. The safest next step is not to upload personal content yet: first settle ownership/licensing and confirm the actual Appwrite security boundary. After those gates, the project can be rebranded within its existing layout and the remaining workflows can be completed in a controlled way.