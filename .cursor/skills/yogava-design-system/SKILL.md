---
name: yogava-design-system
description: Yogava yoga/wellness site design system - theme tokens, layout skeleton, reusable component classes, GSAP/Lenis/Swiper animation hooks, and safe extension rules. Use whenever building, editing, styling, animating, or reviewing any page or section in this project so new work stays visually identical to the pixel-accurate theme clone.
---

# Yogava Design System

Pixel-faithful recreation of the "Yogava" yoga template (ThemeMascot; jQuery namespace `THEMEMASCOT` in `js/script.js`). Stack: static HTML + jQuery 3.7 + Bootstrap 5 grid utilities + GSAP (ScrollTrigger, SplitText, Lenis smooth scroll) + Swiper + Wow/AOS + Fancybox + Appwrite Cloud Web SDK for dynamic content. **Fidelity to the original is the top priority** (see README).

## Golden rules

1. **Never edit vendor/template files** (`css/style.css`, `bootstrap.min.css`, any `js/*.js` that ships with the template). Extend instead.
2. **Reuse existing classes before writing CSS.** If a hook exists (`sec-title`, `theme-btn btn-style-one`, `gsap-fade-up`, `section-padding`, `auto-container`, `fix`), use it in the HTML.
3. New CSS goes in a **small dedicated stylesheet loaded after `style.css`** (pattern: `css/appwrite-services.css`), tightly scoped to the new section/component, with `-webkit-`-prefixed flexbox like the template, and a short "why" comment.
4. New JS goes in a separate file loaded last (pattern: `js/services-data.js`), never inline edits to `script.js`.
5. Colors **only** via the CSS variables below — no raw hex in new code.
6. Manual `<br>` inside titles is intentional (line breaks in display type); CSS hides all `<br>` below 1199.98px.

## Design tokens (css/style.css `:root`, lines 45–130)

### Colors

| Token | Value | Use |
|---|---|---|
| `--theme-color1` | `#417572` muted teal | Primary brand: buttons, marquee band, cursor dot, icon hover fill, reader band |
| `--theme-color2` / `3` / `4` | `#121212`, `#10551F`, `#0d0d0d` | Dark button-wipe, headings, deep green accent |
| `--bg-color` | `#F2F0EC` | Warm off-white section/card background, sub-title pill bg |
| `--theme-color-lighter` / `-silver` | `#f8f5f0` / `#EDF2EC` | Tints |
| `--text-color` | `#787880` | All body copy (muted gray) |
| `--headings-color` | `#121212` | Headings |
| `--review-color` | `#FFAA18` | Star ratings |
| `--theme-color-white` | `#ffffff` | Light text on dark/teal bands + rgb vars `--theme-color{1,2,3,4}-rgb` for rgba borders |

Borders on light cards: `1px solid rgba(var(--theme-color2-rgb), 0.1)`. On dark/teal surfaces: `rgba(var(--theme-color-white-rgb), 0.1)`.

### Typography

| Token | Value | Use |
|---|---|---|
| `--body-font-family` | `"Archivo", sans-serif` — 16px / weight 400 / line-height 1.9 | Body, `p`, `.text` |
| `--heading-font-family` | `"Bricolage Grotesque"` (Google, weight 200–800) | `h1–h6`, `.h1–.h6`, card titles |
| `--font-style-two` | `"Gallient"` (local TTF) | **Display/section titles**, big marquee text — the signature look |
| `--font-style-three` | `"Gotu"`, sans-serif | Buttons, marquee band text, small accent labels |

Sizes: h1 110px, h2 `clamp(30px, 5vw, 64px)`, h3 31.2px, h4 24px, h5 20px, h6 16px; weights 500 (h1–h4) / 400 (h5–h6). Section titles: `clamp(35px, 5vw, 64px)`, line-height 1.3, `letter-spacing: 0`. `text-transform: capitalize` on buttons, card titles, sub-title pills. Selection: dark bg + white text.

## Layout skeleton

```
<section class="{name}-section fix section-padding">      .fix = relative + overflow:hidden (clips floating shapes)
  <div class="outer-box">                                 decorative .shape-N imgs live here
    <div class="bg bg-image"><img ...></div>              optional full-bleed section bg
    <div class="auto-container">                          max 1350px, margin auto, padding 0 15px
      <div class="row gx-4">                              Bootstrap grid; default gutter 30px
        <div class="{name}-block col-xl-4 col-md-6 gsap-stagger-item">
          <div class="inner-block"> ... </div>            block pattern: -block > .inner-block
```

- `.section-padding` = `120px 0` → `80px 0` below 991.98px. `.small-container` = 1000px.
- Floating decorative shapes: `.shape-1/.shape-2/.shape-3` with `float-horizontal` (endless drift) or a gsap fade class.
- Breakpoints: 1599.98 / 1439.98 / 1199.98 / 991.98 / 767.98 / 575.98.
- Alternating light (`#F2F0EC` or white) and full-dark/teal bands (`--theme-color1` / `--theme-color2` with white `.light` text).

## Components — always reuse these

**Buttons** — `class="theme-btn btn-style-one"` (apply this exact pairing):
```html
<a href="#" class="theme-btn btn-style-one">Get Appointment <span><img src="images/icons/arrow.png" alt=""></span></a>
```
Pill radius 50px, Gotu 16px capitalize. Styles: `one` = teal → dark wipe (default), `three` = white → teal wipe (on dark header), `two` = 14px-radius rectangle, `four` = dark → teal. Hover: `:before` curtain `scale(0,1)→scale(1,1)`, origin flips top-right → bottom-left, 500ms `cubic-bezier(0.86, 0, 0.07, 1)`; arrow img rotates −45°. Keep the `<span>` arrow chip — it IS the design.

**Section title** — one per section:
```html
<div class="sec-title mb-50 [text-center] [light]">
  <div class="h2 title char-animation">Display heading here <br>second line</div>
</div>
```
`.char-animation` triggers the GSAP char-by-char reveal. `.light` = white text + frosted sub-title pill (add `<div class="sub-title">Badge</div>` before the title when wanted). Distinctive flourish: inline pill-shaped image inside a title (`<img>` gets `border-radius:100px; width:218px; height:70px; object-fit:cover` under `.services-section`).

**Cards with hover-active pattern** — exactly one card in a group shows the "active" state; JS swaps it on `mouseenter` (see `script.js` service-block handler). Card anatomy for dark/teal bands: 10px radius, white-0.1 border + bg, 50px padding, number in a 50px circle, **two stacked identical `<img>`s** for the blur-crossfade hover (`img:first-child` fades in sharp, `:nth-child(2)` scaleX(2)+blur(10px) fades out; 500ms). Light cards: 14–16px radius, `rgba(theme-color2-rgb,0.1)` border, hover fills `--bg-color`.

**Icon feature blocks**: circular icon chip (50–88px, 1px `rgba(2-rgb,0.1)` border, flaticon/FontAwesome class) that fills teal on hover (optionally `rotateY(-180deg)`), h4 title + `.text`.

## Animation system (the project's feel)

Global: Lenis smooth scroll (duration 1.5) synced to ScrollTrigger; custom cursor (inner 10px teal dot + lagging outer ring, scales 1.5 `back.out(1.7)` over `button, a, .cursor-pointer, .gsap-interactive-img`).

Scroll-trigger classes — add via HTML only, tuning lives in `js/script.js`:

| Class | Effect |
|---|---|
| `.char-animation` | SplitText chars from x+100, stagger 0.05, 1.5s, `back.out(1.7)` — section titles |
| `.gsap-fade-up` | y:100 → 0, 1s `power2.out` |
| `.gsap-fade-left` / `.gsap-fade-right` | x:∓100 → 0, 1.5s |
| `.gsap-stagger-parent` + children `.gsap-stagger-item` | y:100 cascade, stagger 0.5, 1.5s |
| `.gsap-reveal` + `data-origin="top\|left\|right\|bottom"` | clip-path inset wipe, 1.5s `power4.inOut` — images |
| `.gsap-interactive-img` | inner img parallax yPercent −20→20 scrubbed |
| `.anim-fade-move` | Wow/animate.css entry (header bar), pair with `data-delay="0.25"` |

All scroll animations use `toggleActions: 'play reverse play reverse'` — **everything reverses when you scroll back up**. Keep that in any new ScrollTrigger. Defaults: `power2.out`, transitions `all 300ms ease`, image/CTA transitions 500ms.

Other movement: `.float-horizontal` drifting shapes, `.animate-circle` rotating with scroll (`pageYOffset * 0.4`), `.bounce-y`, marquee = duplicated `.marquee-group` translateX loop (10s/20s linear infinite, teal band, Gotu 24px white). Counters: `<span class="count-text" data-speed="3000" data-stop="25">5</span>` inside `.count-box`. Tab buttons get `wow fadeInUp` + `data-wow-delay="200ms"…` steps of 100ms.

## JS conventions

- jQuery namespace `THEMEMASCOT` in `script.js`; feature blocks are `if ( $('.selector').length )` guards.
- Swiper pattern: `speed: 1500`, `loop: true`, mostly autoplay, breakpoints `400/768/1200/1400` → `1/2/3/4` slides; dots `el: '.{name}-slider-dots'` or arrows.
- **Dynamic content**: render into the existing static-fallback markup only on success, escape ALL data text, mirror template class names exactly (CSS hooks), then destroy + re-create the Swiper (`el.swiper.destroy(true, true)` → same options as `script.js`). See `js/services-data.js` for the canonical implementation.
- Appwrite: config is generated from `.env` by `_tools/sync-appwrite-env.py` into `js/appwrite-config.js`; runtime handle is `window.yogavaAppwrite` (`client`, `account`, `tablesDB`). No secrets in frontend code.

## Pre-flight checklist for any new section/component

- [ ] Section naming: `xxx-section` > `outer-box` (`fix` if shapes/clipping) > `auto-container` > row > `xxx-block` > `inner-block`
- [ ] One `sec-title` with `.char-animation`; `<br>` for designed line breaks
- [ ] Buttons use `theme-btn btn-style-one/three` with arrow `<span>`; not custom buttons
- [ ] Colors/fonts only via tokens; text `#787880`, headings `#121212`, bg `#F2F0EC`, primary `#417572`
- [ ] Scroll reveals via the gsap-* hook classes; stagger wrappers for card rows; `play reverse play reverse` in any custom ScrollTrigger
- [ ] Hover states: 300ms ease, `--bg-color` or teal fill; card groups follow the hover-active pattern
- [ ] New CSS in its own file after `style.css`, scoped, `-webkit-` prefixed, commented; new JS in its own file
- [ ] Verify at 1599 / 1199 / 991 / 575 — `<br>`s vanish under 1200px, `.section-padding` drops to 80px

Copy-paste snippets: see [reference.md](reference.md).
