# Yogava — Single-Page Clone

Exact recreation of `https://html.kodesolution.com/2026/yogava-html/index.html` (index page only), rebuilt from the original site's own HTML, CSS, JS, images, and fonts.

## Run locally

```powershell
python -m http.server 8765
# open http://127.0.0.1:8765/index.html
```

Works from any static server (must be served over HTTP, not `file://`, because the CSS uses `@import` and fonts).

## Structure

```
index.html                  Page entry point (original markup, Cloudflare artifacts cleaned)
css/                        bootstrap.min.css + style.css + 13 @import dependencies
                            (animate, aos, swiper, fancybox, jquery-ui, linear, select2,
                             fontawesome, flaticons-common, flaticon-set-medical,
                             flaticon-set-yoga, tm-bs-mp, tm-utility-classes)
js/                         All 21 scripts used by the page:
                            jQuery 3.7.1, popper, bootstrap, fancybox 3.2.10, jquery-ui,
                            wow, select2, appear, lenis, bxslider, knob, swiper, aos,
                            GSAP + ScrollTrigger + SplitText + scroll-smoother/scroll-to,
                            splitType, custom-gsap (template GSAP helpers), script.js (main)
images/                     All images referenced by index.html + CSS url() refs
                            (icons/, banner/, resource/, background/)
fonts/                      Gallient (TF) + FontAwesome (6 weights) + flaticon yoga/medical/common
                            + linearicons (woff2/woff/ttf/svg/eot)
_original.html              Unmodified source snapshot used for recovery reference
_tools/                     Recovery scripts (downloader, verifier, screenshot diff)
_screenshots/               Validation captures (local vs original, desktop/mobile/lightbox)
```

## Fidelity verification (Chrome, CDP-measured)

| Viewport | Original height | Clone height | Overflow |
|---|---|---|---|
| 1440×900 | 10842 px | **10842 px** | none |
| 1280×800 | 10595 px | **10595 px** | none |
| 768×1024 | 14738 px | **14738 px** | none |
| 390×844 | 18687 px | **18687 px** | none |

- All 11 section boxes (header→footer) match the original in size and Y-offset exactly.
- Full-page pixel diff (original vs clone, same viewport): mean abs diff 1.98/255, 0.73% pixels >30 — residual differences are time-varying slider/marquee positions.
- Working: dropdown menus, mobile menu + contact list, service tabs, service/gallery/testimonial Swipers (+ dots/arrows/autoplay), progress counters, char-split animations, scroll-reveal/parallax (GSAP + Lenis smooth scroll), sticky header, custom cursor, preloader, back-to-top, Fancybox lightbox galleries, image hover zooms.

## Intentionally changed

- Cloudflare email obfuscation decoded to plain mailto links (`help@company.com`, `info@example.com` — decoded from the site's own `data-cfemail` payloads) and Cloudflare scripts removed.
- Google Fonts (@import in style.css) still load from fonts.googleapis.com as on the original; everything else is local.

## Known limitation

- The contact form (`action="#"`) has **no backend** — same as the original template, which ships no handler either. Front-end validation (`required` on the name field) works, but submissions go nowhere until an integration (e.g. Formspree/mail handler) is configured. Nav links to other template pages (`page-about.html` etc.) intentionally 404 locally since only `index.html` is in scope.
- `jquery-ui.css` references six jQuery UI sprite images (`images/ui-icons_*.png`) that are **missing on the origin server as well** (verified 404 upstream). They are fetched only when a jQuery UI widget (e.g. datepicker) renders — none exist on this page — so the original and this clone behave identically.

## Layout

```
index.html          entry point
css/                all stylesheets (bootstrap, style.css, 13 @import deps)
js/                 all 21 scripts
images/             icons/, banner/, resource/ + jquery-ui sprites (upstream-missing)
fonts/              Gallient, FontAwesome, flaticon sets, linearicons
_original.html      untouched source snapshot (recovery reference)
_tools/             recovery & verification scripts (not needed at runtime)
_screenshots/       validation captures (original vs clone)
```

> Dev tooling, validation screenshots and the original page snapshot live on the `archive/tooling` branch.
