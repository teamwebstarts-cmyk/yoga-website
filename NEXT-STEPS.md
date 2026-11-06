# Lotus U Yoga — what to do next

Written 6 November 2026. This is the short, plain version. The technical
detail lives in `PROJECT-STATUS.md`; the original scored review is in
`PROJECT-AUDIT.md`.

---

## Where the site stands

**Working today**

- The landing page: hero, about, six services, retreats slider, pricing,
  testimonials, journal, contact form, footer — all with your content,
  your colours (forest green, cream, oxblood) and your phone/Instagram.
- The admin workspace at `dashboard.html`: sign in, add / edit / delete
  workshops and service cards, filter by upcoming / ongoing / completed,
  search, publish or keep as draft.
- Privacy page, 404 page, sitemap, robots, page metadata and structured
  data for Google.

**Not working yet**

- The dashboard has never been tested against the real Appwrite project,
  because that project is **read-only** (billing). Everything was tested
  against simulated data.
- Workshops you add in the dashboard do **not** appear on the public site
  yet. They are stored, but nothing displays them.
- The logo image still says **Yogava**.
- The template, font, icons and photos are **not licensed** for a live
  site.

---

## 1. Do these first (only you can)

| # | Task | Why it blocks everything else |
|---|------|-------------------------------|
| 1 | **Fix Appwrite billing** — Appwrite Console → your organisation → Billing. Then run `node tools/setup-appwrite.mjs` once. | Until the project accepts writes, the dashboard cannot save a single workshop and the contact form cannot deliver a single enquiry. |
| 2 | **Send a Lotus U Yoga logo** (PNG or SVG, ideally 2× size, transparent background). | The header, footer and mobile menu all show the old "Yogava" wordmark. It is the most visible thing left. |
| 3 | **Confirm the facts** — phone `+91 70677 00613`, Indore address wording, the three price points (₹1,999 / ₹3,999 / ₹7,999), "8+ years", and the two testimonials. | I wrote these to look plausible. If any is wrong it is wrong in public. |

---

## 2. Then, the build work (I can do these)

1. **Show workshops on the homepage.** The table and the admin screen are
   ready; the missing piece is a strip that reads the same table, so a
   retreat added in the dashboard appears on the site by itself. This is
   the one feature that makes the dashboard worth using.
2. **Real photography.** The about, gallery, testimonial and service
   images are still the template's stock photos. Section by section is
   fine — send them in any order.
3. **Image upload in the dashboard**, so a workshop card can get its own
   picture without editing files by hand.
4. **Editable hero / about / pricing text** from the dashboard, if you
   want to change wording without asking me.

---

## 3. Before the site goes public (legal, not code)

- **Template licence** — the design came from a ThemeMascot template.
  Either buy the licence or accept the risk; I cannot resolve this.
- **Gallient font** — the copy in `fonts/` is marked personal use only.
- **Flaticon icons** — attribution or a paid plan is required.
- **Stock photos** — the current ones are not yours to publish.
- **Privacy policy** — `privacy.html` still has placeholder company
  details; fill them in or ask me to.
- **Domain + hosting** — nothing is deployed. Any static host works
  (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

---

## 4. Known small issues (not urgent)

- The homepage asks Appwrite for service cards on every visit. While the
  project is read-only that request returns **402** and the page quietly
  falls back to the built-in cards. Harmless, but it shows as a red line
  in the browser console until billing is fixed.
- The "preferred date" field is a plain text box, not a date picker.
- The back-to-top button can sit over the consent line on a narrow phone.
- The template's search overlay was removed: nothing could open it and its
  form posted to a static file. A real search can be added later if you
  want one.

---

## 5. How to check it yourself

```bash
# from the project folder
python3 -m http.server 8099
# then open http://127.0.0.1:8099/index.html
# and        http://127.0.0.1:8099/dashboard.html
```

The dashboard needs an Appwrite account with the `admin` label. Until
billing is fixed it will show the sign-in screen and then fail to load
data — that is expected, not a bug in the page.

---

## 6. What changed in this round

- **Fixed the invisible content.** Sections were animating in from
  `opacity: 0` and the animation reversed when a section left the screen,
  so text, the contact form's **Send message** button, testimonials and
  gallery images could stay permanently invisible — especially when
  arriving from a `#contact` style link. Reveals now play once and stay,
  the stagger delay dropped from 0.5s to 0.09s per item, and a safety net
  fades back in anything that is on screen but still hidden.
- Removed the dead search overlay (unreachable, and its form posted to a
  static page).
- Shortened the "interested in" placeholder so it no longer clips on a
  phone.
- Re-verified: no broken images, no dead anchors, no duplicate IDs, no
  horizontal overflow at 390 / 768 / 1024 / 1440, no unlabelled fields,
  and the dashboard's add / edit / delete / search / filter / Escape
  flows all behave.
