# Lotus U Yoga — website

A single-page yoga studio site (`index.html`) with a small Appwrite-backed
admin dashboard (`dashboard.html`). The visual design comes from a
commercial template and is **not yet licensed for production** — see
"Before launch" below.

```
index.html            Landing page (one page, many sections)
privacy.html          Privacy policy — placeholders must be filled in
404.html              Not-found page
dashboard.html        Admin: sign in, MFA, edit the service cards
css/
  theme/              Template styles (style.css, tm-*.css)
  vendor/             Third-party styles (Bootstrap, Swiper, FA, Flaticon…)
  custom/             Project overrides — appwrite-services.css, a11y.css
js/
  theme/              Template scripts (script.js, custom-gsap.js)
  vendor/             Third-party scripts
  appwrite/           Project code: config, init, services renderer,
                      contact form, dashboard
images/               Logos, icons, photography
fonts/                Gallient (personal-use only — see below)
tools/
  setup-appwrite.mjs  Creates the Appwrite tables/bucket (idempotent)
```

## Run it locally

The site is static; any static server works. Do not open `index.html` from
`file://` — the Appwrite calls need an `http` origin and CORS will fail.

```bash
python3 -m http.server 8080
# http://localhost:8080/index.html
```

## Appwrite

Public identifiers live in `js/appwrite/appwrite-config.js`. The API key
lives **only** in `.env` (git-ignored) and is read by the setup script.

| Table     | Used by        | Permissions                          |
|-----------|----------------|--------------------------------------|
| `services`| homepage slider| read: any · write: `label:admin`     |
| `contact` | enquiry form   | create: any · read: `label:admin`    |

Create/repair both tables (and the `media` bucket) with:

```bash
node tools/setup-appwrite.mjs --dry-run   # preview
node tools/setup-appwrite.mjs             # apply
```

> **The project is currently in read-only mode.** Every API call —
> including authenticated ones — returns `402 team_read_only`. Restore
> normal billing in the Appwrite console (Organisation → Billing) before
> the dashboard or setup script can work.

## What the dashboard can edit

Only the service slider (number, title, image path, text, link). Everything
else — hero, about, pricing, gallery, testimonials, blog, contact details,
footer — is hardcoded in `index.html`.

Images are referenced by **path**, not uploaded: put the file in `images/`
and type its path (`images/resource/service2-1.jpg`). The `media` bucket
exists for a future upload UI.

## How the homepage talks to Appwrite

`js/appwrite/services-data.js` fetches the `services` table over the REST
API (no SDK on the public page), then replaces the five static cards. If
the request fails for any reason, the static cards simply stay — the
section never renders empty.

## Before launch

1. **Licensing.** `css/theme/style.css` is ThemeMascot's commercial
   template; the Gallient font is personal-use only; the Flaticon sets
   need attribution or a Premium licence; the photography is preview-only
   stock. None of it may ship commercially as-is.
2. **Content.** Every string and image is still the template's demo
   content.
3. **Appwrite access.** See the read-only note above, and confirm table
   permissions in the console (the repo cannot verify them).
4. Fill in `privacy.html` placeholders and the `TODO(domain)` markers
   (`index.html` head, `sitemap.xml`, `robots.txt`).

See `PROJECT-AUDIT.md` for the full scored assessment and
`PROJECT-STATUS.md` for what has been fixed and what is still open.
