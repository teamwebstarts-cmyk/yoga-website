# Lotus U Yoga — Full Project Audit

**Repository:** scraped "Yogava" yoga template + Appwrite admin dashboard
**Audit date:** 6 November 2026
**Auditor:** Buffy (code, config, asset, license and live-API review)
**Scope:** every tracked file on `main` (155 files, 44 MB), the Appwrite project it points at, and the third-party assets bundled with it.

---

## 1. Executive summary

You have a **beautifully faithful copy of a commercial template** (design fidelity is genuinely 9/10), with a **thin, single-table admin dashboard grafted onto it**. The visual work is done. Almost everything *behind* the design is either unlicensed, unverified, or not built yet.

Three findings dominate everything else:

1. **Copyright — the site cannot legally go live as-is.** The CSS header itself says `License: copyright commercial`. On top of that, the display font is a *personal-use-only* demo font, the icon fonts are Flaticon assets redistributed without attribution, and the 58 photos are preview-only stock that the template vendor explicitly excludes from purchased files.
2. **The Appwrite project is currently read-only.** I called it live: `HTTP 402 — "This project is in readonly mode"` on project `6ae04d6900049efeae83`. So the dashboard cannot save and the homepage silently falls back to the static cards. The "connection" is **not working right now**, and nothing in the UI tells you that.
3. **The dashboard only manages 5 slider cards.** Hero, about, services tabs, pricing, testimonials, gallery, blog, contact details, footer, SEO — all still hardcoded in `index.html`. When you send me content, roughly 95% of it cannot be edited from the dashboard.

### Overall score: **3.5 / 10** (pre-launch)

Design = 9/10. Everything needed to *operate* the site = 2–5/10.

| # | Area | Weight | Score | Weighted |
|---|---|---|---|---|
| 1 | Copyright & asset licensing | 20% | **2**/10 | 0.40 |
| 2 | Backend / Appwrite integration | 15% | **3**/10 | 0.45 |
| 3 | Legal & privacy compliance | 8% | **2**/10 | 0.16 |
| 4 | Security | 10% | **5**/10 | 0.50 |
| 5 | Admin dashboard (coverage & UX) | 9% | **4**/10 | 0.36 |
| 6 | Design fidelity | 6% | **9**/10 | 0.54 |
| 7 | Front-end correctness (bugs, markup) | 7% | **6**/10 | 0.42 |
| 8 | Accessibility (WCAG) | 7% | **3**/10 | 0.21 |
| 9 | SEO & metadata | 6% | **2**/10 | 0.12 |
| 10 | Performance | 5% | **3**/10 | 0.15 |
| 11 | Content & rebrand readiness | 3% | **2**/10 | 0.06 |
| 12 | Maintainability & docs accuracy | 2% | **5**/10 | 0.10 |
| 13 | Testing, CI, deployment | 2% | **1**/10 | 0.02 |
| | **Total** | **100%** | | **3.49 / 10** |

**Grade: D — "Looks finished, is not finished."**

---

## 2. What I actually verified (vs. what I inferred)

| Check | Method | Result |
|---|---|---|
| All local `src`/`href` targets in `index.html` exist | script over 87 refs | ✅ 0 missing |
| Appwrite project reachable | `GET /v1/account` with project header | ✅ reachable, 401 for guests (expected) |
| Appwrite `services` rows readable | `GET /v1/tablesdb/yogava-main/tables/services/rows` | ❌ **402 project read-only** |
| Appwrite API key present | repo scan + `git log -p` for `standard_...` | ✅ none committed; **no `.env` exists** |
| Appwrite schema / permissions / admin user | needs API key or console | ⚠️ **cannot verify** |
| Template licensing | in-repo license header + vendor terms | ❌ commercial, unlicensed copy |
| Font licensing | font metadata + foundry license pages | ❌ Gallient = personal use only |
| Icon licensing | Flaticon license terms | ❌ attribution missing / redistribution not allowed |
| GSAP plugin licensing | bundles' own headers | ❌ SplitText 3.11.2 + ScrollSmoother 3.11.4 are Club-only |
| Body-text contrast | computed WCAG ratio | ❌ 3.85:1 and 4.38:1 (needs 4.5:1) |
| Semantic headings | parsed `index.html` | ❌ zero `<h1>`/`<h2>` elements |
| Initial page weight | summed files referenced by `index.html` | ~1.9 MB CSS+JS, +655 KB SDK, +9.03 MB images |
| Browser/visual re-verification | no Chrome/Chromium on this machine | ⚠️ **not performed** — findings are static + API based |
| Tests | 0 test files, no package.json | ❌ none exist |

I did **not** run the site in a browser. Every behavioural claim below is from source reading, plus the live Appwrite API. The README's pixel-diff numbers are the previous author's, not re-verified.

---

## 3. BLOCKERS — fix before any content work

### B1. Licensing (P0, legal) — the real "scraped website" problem

You asked specifically about the things people don't realise when they scrape. Here is every asset class, with a verdict.

| Asset | What it actually is | Verdict | What to do |
|---|---|---|---|
| `css/theme/style.css` (16.3k lines), `tm-bs-mp.css`, `tm-utility-classes.css`, `js/theme/*` | ThemeMascot's **paid** template code. File header: `License: copyright commercial` | ❌ **Unlicensed copy.** Scraping a live demo is not a licence, and demo downloads/purchase records are how vendors enforce this | Buy the template (ThemeForest, ThemeMascot) or commission a rebuild. Keep the purchase receipt |
| `images/**` (58 files, 9.03 MB) | The vendor's **preview** photography. ThemeMascot's own listings state: *"All images are used for preview purpose only and not included in the final purchase files."* | ❌ **Not covered even if you buy the template.** Also model releases, not yours | Replace with your own shoot or licensed stock (see §9 inventory) |
| `fonts/gallient/GallientRegular-eZoMp.ttf` | DYSA Studio demo build. Licence: *"ONLY FOR PERSONAL USE… NO PROMOTIONAL & COMMERCIAL USE"* | ❌ **Direct violation.** It is the signature display font everywhere | Buy a **webfont** licence (desktop licences usually exclude web) or swap the display face |
| `flaticon-set-yoga`, `flaticon-set-medical`, `flaticons-common` icon fonts | Flaticon icon fonts | ❌ Free tier requires visible attribution *"Icon made by {author} from Flaticon"*; redistributing the font files is also disallowed | Add footer/credits attribution **or** buy Flaticon Premium and archive the licence PDFs |
| FontAwesome 6 (6 weights, 5 formats each) | FA Free | ⚠️ Icons are CC BY 4.0 (attribution), fonts SIL OFL, code MIT | Add attribution in credits; delete unused weights/formats |
| `gsap.min.js` 3.11.5, `ScrollTrigger` 3.11.5, `ScrollToPlugin` 3.11.4 | Standard GSAP licence | ✅ Free (as of 3.13, GSAP core **and all plugins** are free for commercial use) | Fine — but see next row |
| `SplitText.min.js` 3.11.2, `gsap-scroll-smoother.js` 3.11.4 | **Club GreenSock** plugins. Their own headers say they are *"only authorized for use… with an active Club GreenSock membership"* | ❌ **Licence violation at the bundled version.** No membership exists in this repo | **Upgrade GSAP to ≥3.13** (plugins become free) — and delete ScrollSmoother: it is loaded but never used |
| Google Fonts (`Archivo`, `Bricolage Grotesque`, `Gotu`) | Google Fonts via `@import` | ⚠️ OFL fonts are free, but hotlinking sends visitor IPs to Google (GDPR exposure, German case law) and blocks rendering | **Self-host** the woff2 files |
| `appwrite@29.1.0` from jsDelivr | CDN script | ⚠️ No SRI; third-party runtime dependency | Pin + add `integrity`, or drop the SDK on public pages (see P4) |
| Testimonial names/photos ("Dianne Russell", "Emily Carter", stock portrait) | Invented people + a real model's face | ❌ Personality/misrepresentation risk | Replace with real, consented testimonials |
| Product name "Yogava", title, README, `THEMEMASCOT` namespace | The theme vendor's brand | ⚠️ Not your trademark; confusing | Rebrand to **Lotus U Yoga** everywhere |

**Bottom line:** the design is the only thing you own here. Everything else is either licensed to someone else or explicitly personal-use/preview-only.

### B2. Appwrite project is read-only (P0, functional)

Live evidence:

```
GET https://nyc.cloud.appwrite.io/v1/tablesdb/yogava-main/tables/services/rows
X-Appwrite-Project: 6ae04d6900049efeae83
→ 402 {"message":"This project is in readonly mode. Please contact the organization admin…",
       "type":"team_read_only","version":"2.7.1"}
```

Consequences:

- Admin login / row writes will fail → every Save and Delete errors out.
- The public homepage **cannot read** rows, so `services-data.js` catches the error and keeps the 5 static cards.
- **The failure is silent on the homepage** (only a `console.warn`). You could launch, assume the dashboard works, and never see your services change.

This is almost certainly a plan/billing state on the Appwrite organisation (free-plan pause / unpaid invoice / org set read-only), not a code bug. Fix in Appwrite Console → Organisation → Billing, then re-run the check above; it must return `200` with a `rows` array.

### B3. The dashboard is wired, but barely covers the site (P0, product)

| Content | Editable in dashboard? |
|---|---|
| Service slider cards (5) | ✅ |
| Everything else — nav, hero, about, 5 service tabs, why-choose-us, pricing (3 plans), gallery (13 images), testimonials, contact form, blog (3), footer, address, phone, email, socials, SEO | ❌ hardcoded HTML |

Also: **images cannot be uploaded.** The form has a text field "Image path" (e.g. `images/resource/service2-1.jpg`). You must manually drop files into the repo and type the path. There is no Appwrite Storage bucket, no upload UI, no validation that the path exists.

And: **no contact-form backend at all.** `<form action="#">` — submissions reload the page with query strings and are lost. No `contact` or `bookings` table exists. Your leads currently go nowhere.

### B4. No booking flow

Every CTA says "Book Now", "Get Appointment", "Claim Your Place". None of them book anything — internal links are `href="#"` (63 occurrences in `index.html`).

---

## 4. Backend / Appwrite — detailed findings

| ID | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| A1 | P0 | Project read-only; all API calls 402 | live API call | Appwrite Console → org billing |
| A2 | P1 | `_tools/sync-appwrite-env.py` is referenced by 6 files but **does not exist** (gitignored, and the `archive/tooling` branch the README promises is not even on the remote) | `.env.example`, `appwrite-config.js` header, `appwrite-init.js`, `services-data.js`, `dashboard.js`, README | Recreate the generator, or delete the "AUTO-GENERATED / re-run" instructions |
| A3 | P1 | No `.env` in the repo, so config is in practice **hand-edited** despite claiming otherwise | `ls .env` → absent | Commit `.env.example` review + restore tooling |
| A4 | P1 | `orderAsc('number')` sorts a **text** field → `"10"` before `"2"` | `services-data.js` `fetchRows()` | Store an integer `sort` field, or zero-pad and sort on it |
| A5 | P1 | `ROW_LIMIT = 12` silently hides rows 13+ on the site while the dashboard lists all | same | Remove the limit or paginate both sides |
| A6 | P1 | No schema contract in repo (field types, required, permissions). Cannot verify the README's claim that writes require `label:admin` | no migrations/setup script | Add an idempotent setup script + document permissions |
| A7 | P2 | No `published` / draft flag — saves go live instantly | dashboard | Add boolean `published`, filter public query |
| A8 | P2 | No unique constraint on `number`; duplicates render duplicate slides | schema | Unique index, or normalise on save |
| A9 | P2 | No caching; every page view calls the API | `load()`, no sessionStorage | Cache rows ~5 min in `sessionStorage`, render instantly |
| A10 | P2 | No loading state → cards swap after paint, height jumps (CLS) | `render()` replaces `innerHTML` after fetch | Reserve card height / skeleton |
| A11 | P2 | `TablesDB` guarded but if absent the whole feature disables with only a warn | `appwrite-init.js` | Detect at boot and show a clear banner in dashboard |

---

## 5. Admin dashboard — detailed findings

**Working well:** email + password + **email MFA**, charted state machine, `account.get()` used as the "fully authenticated" probe, password cleared after submit, buttons disabled during requests, `noindex`, and text rendered via `textContent` (no XSS in the table).

| ID | Severity | Finding | Fix |
|---|---|---|---|
| D1 | P1 | Admin check `user.labels.indexOf('admin')` is **client-side only**. Real enforcement must be table permissions. Unverifiable right now (read-only project, no key) | Verify in Console; if permissions are row/table-level `label:admin`, good — document it with screenshots |
| D2 | P1 | No "forgot password" link | Add Appwrite recovery flow |
| D3 | P2 | No session-expiry handling: if the session dies mid-edit, you get a raw 401 message and your typed data is lost | Catch 401 → return to login, preserve form draft |
| D4 | P2 | Raw Appwrite error strings shown to the user (`err.message`) | Map to friendly copy |
| D5 | P2 | "Number" accepts any text; no numeric/ordering validation | `pattern` + server-side integer |
| D6 | P2 | No image upload, only a path textbox (see B3) | Appwrite Storage bucket + file picker |
| D7 | P2 | Delete uses native `confirm()`; no undo/audit trail | Soft-delete or an `activity` table |
| D8 | P3 | Loads the whole public site CSS (style.css + 16 `@import`s + 500 KB FontAwesome) for a 3-view admin page | Separate small admin CSS |
| D9 | P3 | Table has no loading indicator; `loadRows()` has no spinner | Add skeleton rows |
| D10 | P3 | Preview image updates on `change` only (blur) — typing a URL shows nothing until you leave the field | Also listen to `input` (debounced) |

---

## 6. Security — detailed findings

| ID | Severity | Finding | Why it matters | Fix |
|---|---|---|---|---|
| S1 | **P1** | Stored XSS through the `link` field. `esc()` escapes HTML entities but does **not** block URI schemes, so `javascript:alert(1)` is stored and rendered as `<a href="javascript:…">` for every visitor | Any admin/editor compromise becomes site-wide XSS | Allowlist `http:`, `https:`, relative, `mailto:`, `tel:`; reject the rest |
| S2 | P2 | `image` src unvalidated → external tracking pixels or `data:` URIs injected into the page | Privacy/abuse | Allowlist relative paths + your own storage domain |
| S3 | P2 | No Subresource Integrity or CSP; SDK loaded from jsDelivr | Supply-chain compromise runs code on your site | SRI hash + CSP `script-src` |
| S4 | P2 | No security headers at all (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) | Standard hardening | Add at the host/CDN level |
| S5 | P2 | Admin page is a public URL (`/dashboard.html`); only Appwrite permissions protect it | If a permission is wrong, anyone can write | Verify permissions; consider a separate admin subdomain |
| S6 | P3 | Vendored libs are old and unpinned by any manifest (jQuery UI 1.12.1 from **2016**, WOW 2014, bxSlider 2017); no dependency scan | Known-CVE drift | Prune unused libs; keep a `package.json` + audit |
| S7 | ✅ | No secrets committed (checked tracked files **and** full `git log -p`) | — | Keep `.env` ignored |
| S8 | ✅ | Public project ID in frontend is expected and safe | — | — |

---

## 7. Front-end correctness — detailed findings

| ID | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| F1 | **P1** | **Hover-active effect dies after Appwrite renders.** `script.js` binds `mouseenter` to the 5 static `.inner-block` nodes at load; `services-data.js` then replaces them via `innerHTML`. New nodes have no listener | `script.js` `boxes.forEach(...)`, `services-data.js` `wrapper.innerHTML` | Delegate on the wrapper (`.service-slider` + `closest()`), or re-bind after render |
| F2 | P1 | Double Swiper init: `script.js` builds the slider, then `services-data.js` destroys and rebuilds it → visible jump + wasted work | both files | Skip the theme init when Appwrite is configured (or render before init) |
| F3 | P2 | `titleToHtml()` splits titles at the *middle word*; no way to control the design's line break from the dashboard | `services-data.js` | Add a `line2` field, or accept auto-split explicitly |
| F4 | P2 | `<seciton class="gallary-section-two">` — invalid tag (gallery-two block) | `index.html` | `</section>` |
| F5 | P2 | Two stray `</i></i>` in the About icons | `index.html` | Remove |
| F6 | P2 | `<li>` directly inside `div.social-icon-two` (no `<ul>`) — invalid list markup | footer | Wrap in `<ul>` |
| F7 | P2 | Contact form has **three** inputs all named `name`, plus `number`/`email`/date/retreat; sending one field name three times | `index.html` | Rename: `name`, `phone`, `email`, `date`, `retreat` |
| F8 | P2 | Search popup posts to `index.html` — there is no search | header | Remove, or wire to a real search |
| F9 | P2 | `jquery-ui.css` is **corrupted**: every letter `i` was replaced by `m` (`accordmon`, `datepmcker`, `dmalog`, `checkboxradmo`, `jqueryum.com`, `mmages/um-mcons_*.png`) | `css/vendor/jquery-ui.css` line 2–4 | Re-download from upstream 1.13.x |
| F10 | P2 | ~70 CSS `url()` targets are missing, incl. `images/icons/pattern-*.png`, `images/background/footer1-pattern*.png` | CSS scan | Harmless today (unused selectors) but will 404 the moment you add those components — prune or restore |
| F11 | P3 | Dead template code runs every load: colour-switcher AJAX, `mixItUp()`, `scrollToFixed()`, two Swipers on non-existent `.destination-active` / `.testimonial-active-home-two`, bxSlider, knob, select2 | `script.js` | Prune during optimisation |
| F12 | P3 | `Lenis.raf(time * 500)` — GSAP ticker passes **seconds**, Lenis expects **ms**; ×500 means smooth scroll runs ~at half intended speed | `script.js` | Use `time * 1000` (then re-tune `duration`) |
| F13 | P3 | `smoothHover: true` is not a Lenis 1.1 option (no effect) | `script.js` | Remove |
| F14 | P3 | `lagSmoothing(500,16)` then immediately `lagSmoothing(0)` | `script.js` | Keep one |
| F15 | P3 | Template files are labelled "do not edit / do not ever edit" in the README and the skill file, **but `script.js` already contains custom edits and Bengali comments** | `js/theme/script.js` | Accept that it is fork-edited; move your edits into `js/custom/` and document the divergence |
| F16 | P3 | "25+ Years of Work Experience" counter starts as `5` in HTML, animates to 25 (no-JS shows 5) | about section | Set the fallback text to the real number |
| F17 | P3 | No-JS: the whole page depends on JS for menus/sliders; preloader is JS-hidden | — | Add `<noscript>` note; ensure `.preloader` never blocks |

---

## 8. Accessibility — detailed findings (WCAG 2.1 AA)

| ID | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| C1 | **P1** | **Zero semantic headings.** Every heading is `<div class="h1/h2/h3">`; the document has **0 `<h1>` and 0 `<h2>`** | parse of `index.html` | One real `<h1>` (the banner line), `<h2>` per section, keep the classes for styling |
| C2 | P1 | 98 of 118 images have `alt=""`; logo links and gallery links have no accessible name | parse | Meaningful `alt` for content images; `alt=""` only for truly decorative shapes |
| C3 | **P1** | Body text fails contrast: `#787880` on `#F2F0EC` = **3.85:1**, on `#ffffff` = **4.38:1** (AA needs 4.5:1 at 16 px) | computed | Darken `--text-color` to ~`#5f5f68` (≈5.3:1) or bump body size to 18 px+ |
| C4 | P1 | Focus is invisible: template CSS sets `outline: none !important` globally (the admin CSS works around it) | `style.css` | Add a global `:focus-visible` ring in `css/custom/` |
| C5 | P1 | No `prefers-reduced-motion` support despite Lenis scroll-hijack, char-splitting, parallax, marquee | all animation code | Media query that disables Lenis + GSAP reveals |
| C6 | P2 | Custom cursor + scroll hijacking | `script.js` | Disable on touch and reduced-motion |
| C7 | P2 | Icon-only social links, slider arrows (`div`s with images), gallery links have no `aria-label`/button role | markup | Add `aria-label`, make controls `<button>` |
| C8 | P2 | Public form: no `<label>`, placeholder-only, only name is `required`, no autocomplete | contact section | Real labels (visually hidden ok), `autocomplete`, proper types |
| C9 | P2 | Mobile menu / search popup: no focus trap, no `Esc`, no `aria-expanded` | header | Add dialog semantics |
| C10 | P3 | Duplicated marquee text is read twice by screen readers | marquee | `aria-hidden="true"` on the duplicate `.marquee-group` |
| C11 | P3 | No skip-to-content link | — | Add |

---

## 9. SEO — detailed findings

| ID | Severity | Finding | Fix |
|---|---|---|---|
| E1 | **P1** | `<title>Yogava - Yoga Fitness HTML Template \| Home Page 01</title>` — literally advertises the template | "Lotus U Yoga — Yoga & Wellness Studio in <city>" |
| E2 | P1 | No `<meta name="description">` | Add 150–160 char description |
| E3 | P1 | No Open Graph / Twitter cards → ugly link previews on WhatsApp/Instagram | Add og:title/description/image/url/type |
| E4 | P1 | No canonical URL | Add |
| E5 | P1 | No structured data (LocalBusiness / YogaStudio / Service / Article) | JSON-LD with address, hours, phone, geo, sameAs |
| E6 | P1 | No `robots.txt`, no `sitemap.xml`, no 404 page | Add all three |
| E7 | P1 | 63 `href="#"` links; nav, footer and all CTAs go nowhere | Real pages or in-page anchors |
| E8 | P2 | No internal linking; single page, no service/blog URLs to rank | Add per-service and per-post pages |
| E9 | P2 | Favicon is 37×45 (non-square, no apple-touch/manifest) | 32², 180², 512² maskable + manifest |
| E10 | P2 | Image filenames typo'd (`gallary*`) and alts generic ("GallerImg") | Rename + descriptive alts |
| E11 | P3 | No analytics / Search Console / sitemap submission | Choose privacy-friendly analytics |
| E12 | P3 | `lang="en"` correct; no `hreflang` needed unless you go multilingual | — |

---

## 10. Performance — measured

Initial load, uncompressed, from `index.html` alone:

| Bucket | Size |
|---|---|
| CSS directly linked (bootstrap 226 KB + style.css 383 KB + 2 KB) | **611 KB** |
| CSS pulled by 16 `@import`s in `style.css` (incl. 501 KB FontAwesome) | **~809 KB** |
| JS, 24 local files (of 25 `<script>` tags; jQuery UI alone 508 KB) | **~1.29 MB** |
| Appwrite SDK from jsDelivr | **655 KB** |
| Images referenced by `<img>` (58 unique) | **9.03 MB** |
| **Total before compression** | **≈ 11.6 MB** |

| ID | Severity | Finding | Fix |
|---|---|---|---|
| P1 | **P1** | 17 CSS requests chained through `@import`: the browser must download `style.css` before it even discovers the other 13 vendor files — guaranteed slow LCP on mobile | Replace `@import` with `<link>` tags (or one bundled file) |
| P2 | P1 | 655 KB SDK loaded on the homepage only to fetch 5 cards | Use a plain `fetch()` against the REST endpoint on public pages; keep the SDK in the dashboard |
| P3 | P1 | ~9 MB of images, several >500 KB (`service-bg1-1.png` 1.05 MB, `service2-2-bg.png` 958 KB, `contact1-1.jpg` 895 KB) | Convert to WebP/AVIF, resize to display size, compress |
| P4 | P1 | No `loading="lazy"`, no `decoding="async"`, no `width`/`height` on 118 `<img>` → layout shift | Add all three |
| P5 | P2 | 9.5 MB fonts: FontAwesome in 6 weights × 5 formats; only 2–3 weights used | Ship woff2 only, subset, drop duotone/thin/light if unused |
| P6 | P2 | No minification/bundling of theme CSS/JS | Minify at build or serve minified copies |
| P7 | P2 | 19 vendor scripts loaded, most unused on this page (jquery-ui, bxSlider, knob, select2, aos, wow, splitType, scroll-smoother) | Remove what the page doesn't use |
| P8 | P2 | 3 Google Fonts families via `@import` (extra RTTs, render-blocking, third-party) | Self-host + `<link rel="preload">` |
| P9 | P3 | No cache-header guidance; no preload of the hero image; no `preconnect` | Configure host + preload hero/font |
| P10 | P3 | Two stacked identical `<img>`s per service card for the blur effect doubles HTML but is cached (one request) | Acceptable trade-off; note it |

---

## 11. Legal & privacy compliance

| ID | Severity | Finding | Fix |
|---|---|---|---|
| L1 | **P1** | Contact form collects name, phone, email, date with **no privacy notice, no consent checkbox, no linked policy** | Add consent text + privacy policy page |
| L2 | P1 | No Privacy Policy, Terms, Imprint/Impressum, cookie notice | Add (jurisdiction-dependent) |
| L3 | P2 | Google Fonts hotlinked → visitor IPs sent to Google (GDPR exposure) | Self-host |
| L4 | P2 | Testimonials present invented people/ratings as real ("2,488 Rating", "4.9") | Use verifiable numbers or remove |
| L5 | P2 | Advertising claims that must be true ("25+ years", "3,842,946+ views") | Verify or remove |
| L6 | P2 | No accessibility statement | Optional but expected for public sites in some regions |
| L7 | P3 | Email MFA means admin access depends on a mailbox — document the recovery path | Add recovery codes |
| L8 | P3 | No data-retention/backup policy for leads | Define once the contact table exists |

---

## 12. Maintainability & documentation accuracy

| ID | Severity | Finding |
|---|---|---|
| M1 | P1 | README documents `_tools/` (downloader, verifier, screenshot diff), `_original.html`, `_screenshots/`, and an `archive/tooling` branch. **None exist** — not on `main`, not on the remote (remote branches are only `feature/*`, `refactor/*`, `fix/*`). The recovery scripts are gone |
| M2 | P1 | README says "All 25 scripts… 13 `@import` deps"; reality is 25 scripts (ok) and **16** imports; "21 scripts" appears later in the same file |
| M3 | P1 | `appwrite-config.js` header says "AUTO-GENERATED… do not edit" — the generator is missing, so it is in fact hand-edited |
| M4 | P1 | README claims access is "enforced twice" incl. server-side table permissions — unverifiable, and the project is currently read-only anyway |
| M5 | P2 | 70 broken CSS `url()` references; corrupted `jquery-ui.css` (mangled by an `i`→`m` text replacement — evidence the scraping pipeline damaged files) |
| M6 | P2 | 9 stale remote branches; merge/squash mix; no release tags |
| M7 | P2 | No `package.json`, lockfile, lint/format config, or editor config |
| M8 | P3 | Huge unminified theme files (style.css 16,306 lines) — every future change is a merge hazard |
| M9 | ✅ | Directory split (`vendor`/`theme`/`custom`) is clean and the `css/custom` overrides are well-scoped and commented |
| M10 | ✅ | `.cursor/skills/yogava-design-system/` is unusually good documentation of the design system — keep it |

---

## 13. Testing & deployment

| ID | Severity | Finding | Fix |
|---|---|---|---|
| T1 | **P1** | **Zero tests.** `detected_test_files: 0`; no runner, no CI | Add smoke tests: page loads, rows render, login + CRUD happy path |
| T2 | P1 | No deployment config; `.env.example` mentions Render but there is no `render.yaml`/`netlify.toml`/`vercel.json` | Pick a host, commit config |
| T3 | P2 | No 404/redirect rules, no www/apex decision, no HTTPS enforcement documented | Add |
| T4 | P2 | No backup/export for the `services` table | Scheduled export or a CSV button |
| T5 | P2 | No visual regression baseline (README's screenshots are gone) | Re-capture 4 viewports after rebrand |
| T6 | P3 | No monitoring/uptime/error tracking | Add once live |

---

## 14. Asset & content inventory for the rebrand (your "content drop" checklist)

Replace **without changing layout**. Exact current dimensions so your designer can match aspect ratios:

**Logos** (transparent PNG, supply at 2× for retina)
| File | Current size | Used in |
|---|---|---|
| `images/logo.png` | 157×45 | header |
| `images/logo2.png` | 149×45 | sticky header + mobile menu |
| `images/logo3.png` | 185×50 | footer |
| `images/favicon.png` | 37×45 ⚠️ non-square | favicon |

**Photography**
| File | Size | Section |
|---|---|---|
| `banner/banner1-1.png` | 622×786 | hero figure (transparent cut-out) |
| `banner/banner1-1.jpg` | 530×728 | hero backdrop behind the cut-out |
| `banner/banner1-2.jpg`, `banner1-3.jpg` | — | decorative hero cards |
| `resource/about1-1.jpg` | 532×552 | about |
| `resource/service1-1.jpg` | 825×440 | **used for all 5 service tabs** |
| `resource/service2-1…5.jpg` | — | service slider (dashboard-managed) |
| `resource/wcu1-1.jpg` | — | why-choose-us |
| `resource/testi1-1.jpg` | — | testimonial (person portrait) |
| `resource/contact1-1.jpg` | 895 KB | contact |
| `resource/gallary1-1…7.jpg` | — | gallery one (7) |
| `resource/gallary2-1…6.jpg` | — | gallery two (6) |
| `resource/blog1-1…3.jpg` | — | blog cards |
| `resource/service-bg1-1.png`, `service2-1-bg.png`, `service2-2-bg.png`, `contact1-1-bg.png`, masks | 765 KB–1.05 MB | section backgrounds/masks |

**Copy that must be replaced (placeholders / wrong industry)**
- `"We believe in delivering top-tier technology solutions"` (service cards)
- `"everyone with high and useful reward for his Financial statement"` ×4 (why-choose-us)
- `"From branding to web development…"` (testimonials)
- `"It is a long established fact that a reader will be distracted… Lorem Ipsum"` (about)
- `"© Copyright 2026 by Company.com"`, `help@company.com`, `info@example.com`
- Address `"2972 Westheimer Rd. Santa Ana, Illinois 85486"` (Figma placeholder), `"+1 200-123-1234"`
- **Three different phone numbers** in three countries: `+92 (8800)-98670` (mobile menu), `+8801750050088` (sticky header), `+1 200-123-1234` (footer)
- Nav labels for pages that don't exist: Home 02, Team, Shop, Cart, Checkout, 404, Project…
- All three blog dates are `15 Dec 2025`
- Stats: `3,842,946+` YouTube views, `25+` years, `4.9` / `2,488 Rating`, `5+` experience
- Typos: "Screen- Free" (double space), "Make ap Appointment First", "gallary"
- Dashboard placeholders: `admin@yogava.com`, brand "Yogava" in the topbar

---

## 15. What is genuinely good (don't rewrite these)

1. **The design implementation is excellent** — complete assets, no missing local references, thoughtful `css/custom` scoping, documented tokens.
2. **The services renderer is well built** — HTML escaping, static fallback on failure, Swiper destroy/recreate with identical options, equal-height card CSS, restrained logging.
3. **The Appwrite init is correct in spirit** — no secrets client-side, feature-detects `TablesDB`, localhost-only debug output, single `window.yogavaAppwrite` handle.
4. **The auth flow is above average for a static admin** — email MFA, disabled buttons, cleared password, `noindex`, label gate, friendly state machine.
5. **No secrets in git** (verified history).
6. **The design-system skill file** is better documentation than most agencies ship.

---

## 16. Prioritised action plan

### Phase 0 — Legality & access (do this week, before any content)
1. Decide: **buy the template licence** or **commission a clean rebuild** of the design. Nothing else you do is safe until this is settled.
2. Buy a **commercial webfont licence** for Gallient (or approve a substitute display face).
3. Resolve **Flaticon** (attribution or Premium) and **FontAwesome** attribution.
4. **Upgrade GSAP to ≥3.13** (makes SplitText/ScrollSmoother free) and delete the unused ScrollSmoother file. *(½ day)*
5. **Fix the Appwrite read-only state** in the Console, then re-run the `rows` check → must be `200`. *(minutes once billing is fixed)*
6. Replace all **preview stock photography** and **invented testimonials**.

### Phase 1 — Make the site honest (1–2 weeks)
7. Rebrand: title, meta, logos, favicon, footer, emails, phones, address, dashboard brand, README.
8. Build the **contact pipeline** (Appwrite `contact` table + notifications) and add consent/privacy pages.
9. Add real **SEO fundamentals**: description, OG, canonical, JSON-LD, robots, sitemap, 404.
10. Fix **semantic headings**, contrast, focus rings, `prefers-reduced-motion`.
11. Fix the concrete bugs: F1 (hover handler), F4–F8, A4 (numeric sort), S1 (URL scheme allowlist), F9 (re-download jQuery UI).

### Phase 2 — Make the dashboard actually manage the site (2–4 weeks)
12. Extend the schema + dashboard to the content you'll actually change: hero, about, services tabs, pricing, testimonials, gallery, blog, contact details, socials, SEO defaults.
13. Add **image uploads** via Appwrite Storage (with resize/WebP on upload).
14. Add **bookings/inquiries** with status, and email notification.
15. Add `published`/draft, explicit line-break control, ordering, audit trail.

### Phase 3 — Performance & ops (1–2 weeks)
16. Remove the SDK from public pages (plain REST `fetch`), or code-split it.
17. Convert `@import` → `<link>`; bundle/minify; drop unused libs.
18. Images → WebP/AVIF + `srcset` + lazy + dimensions; fonts → woff2 subset only.
19. Self-host Google Fonts.
20. Add host config (headers, caching, HTTPS, redirects), CI smoke tests, backups.

**Rough total:** 5–8 weeks of focused work for a launch-ready, legally clean, operable site — of which the design work is already done.

---

## 17. Decisions I need from you before content goes in

1. **Licence path:** buy the Yogava template, or rebuild the design clean? (Affects everything else.)
2. **Hosting + domain** for Lotus U Yoga (and whether the site is one page or multi-page).
3. **Business facts:** legal name, address, timezone/city, hours, phone, email, socials, currency.
4. **Photography:** are you providing your own shoot, or should I plan licensed stock?
5. **Contact destination:** email inbox, CRM, or Appwrite table + admin inbox?
6. **Booking scope:** simple enquiry form, or real class schedule + capacity + payments?
7. **Which content must be dashboard-editable** — everything, or just the sections you'll change weekly?
8. **Languages & legal jurisdiction** (privacy/terms requirements differ).

---

## Appendix A — How to re-verify the backend yourself

```bash
P=6ae04d6900049efeae83
E=https://nyc.cloud.appwrite.io/v1

# Project alive?
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Appwrite-Project: $P" "$E/account"

# Public services readable?  (must be 200 with a "rows" array)
curl -s -H "X-Appwrite-Project: $P" \
  "$E/tablesdb/yogava-main/tables/services/rows" | head -c 400
```
Current result: `402 team_read_only` → dashboard writes and homepage reads both fail.

## Appendix B — Files reviewed

`index.html` (1,224 lines), `dashboard.html` (124), `README.md`, `.env.example`, `.gitignore`, `js/appwrite/*` (4 files), `js/theme/*` (2), `css/custom/*` (2), `css/theme/*` (3), all 25 `js/vendor` and 11 `css/vendor` headers, font metadata, git history (18 commits, 10 branches), and live Appwrite API responses.

---

## 18. Self-review of this audit, and what has since been fixed

I re-ran every measurable claim in this document after writing it. Two
figures were slightly off and are corrected below; everything else held.

| Claim | Re-checked | Result |
|---|---|---|
| 118 `<img>`, 98 with `alt=""` | scripted count | ✅ exact |
| 63 `href="#"` | scripted count | ✅ exact |
| 0 `<h1>` / 0 `<h2>` | scripted count | ✅ exact (11 elements carried `.h2`, 1 carried `.h1`) |
| 25 `<script>` tags, 1 external | scripted count | ✅ exact (24 local files) |
| Contrast 3.85:1 / 4.38:1 | recomputed with WCAG formula | ✅ exact |
| "~70 missing CSS `url()` targets" | re-scan | ⚠️ **71 occurrences, 69 unique** — corrected (M5) |
| "16 `@import`s incl. 501 KB FontAwesome" | re-scan | ✅ exact (3 Google Fonts + 13 local) |
| Hover binding at `script.js:186` | re-read | ✅ confirmed |
| Lenis ticker `time * 500` | re-read | ✅ confirmed |

Two files present at review time but missed in the original inventory:

| File | Finding |
|---|---|
| `deshboard.env` | Contained a **live 266-character Appwrite API key** and was **not** covered by `.gitignore` — one `git add .` from publication. Tracked history was clean. Renamed to `.env` (already ignored). |
| `PROJECT_REVIEW.md` | A separate, earlier readiness review (157 lines, overall 2/10). Its findings agree with this audit; it is independent of it. |

**Schema verification is now definitively impossible, not just unverified.**
I retried with the project's own API key as well as anonymously: both
return `402 team_read_only`. So findings that depend on the remote schema
(A6, D1, S5, and the "enforced twice" claim in M4) remain **unknown** — not
failed, and not passed.

### Findings resolved in the first remediation pass

GSAP licensing (B1), jQuery UI corruption (F9), `@import` waterfall (P1),
SDK on the public page (P2), numeric sort (A4), row cap (A5), caching (A9),
draft filter (A7), contact form (B3), setup tooling (A2), session expiry
(D3), error messages (D4), loading state (D9), preview (D10), TablesDB guard
(A11), hover delegation (F1), double Swiper (F2), Lenis ticker (F12/F13/F14),
`<seciton>` (F4), stray tags (F5), counter fallback (F16), stored XSS (S1),
image src validation (S2), semantic headings (C1), alt text (C2), contrast
(C3), focus (C4), reduced motion (C5), form labels (C8), skip link (C11),
metadata/OG/JSON-LD (E1–E5), robots/sitemap/404 (E6), privacy notice (L1/L2),
lazy loading (P4), leaked key file.

Everything still open is tracked in **`PROJECT-STATUS.md` §3**, grouped by
who has to act: Appwrite billing (you), licences (you), content (you via me),
or deferred build work. The score table in §1 has deliberately **not** been
rewritten — it describes the project as received, and re-scoring it before
the three blockers clear would flatter it.
