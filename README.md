# Zero — marketing landing page

Standalone static marketing site. No build step, no dependencies to install, no framework,
no animation library. Two Google fonts load from a CDN; everything else — layout,
illustrations, motion, form logic — is local.

```
index.html                  the whole page
styles.css                  design tokens, layout, dark mode, motion
app.js                      theme toggle, scroll reveals, FAQ accordion, demo form (FORM_ENDPOINT at the top)
card-split-accordion.html   the FAQ accordion on its own, as a component reference
test-form.js                runnable check for the form + accordion
test-theme.js               runnable check for the theme toggle
```

## dev

```sh
npx serve .          # or: python -m http.server 5173
```

http://localhost:3000 (serve) or http://localhost:5173 (http.server).
Opening `index.html` straight off the filesystem works too.

## build

None — these files *are* the build output.

Vercel: import the repo, **Framework preset** *Other*, **Root directory** `marketing`,
build command empty, output directory `.`.

## test

```sh
npm i -D playwright                         # needs the dev server running
node test-form.js
node test-theme.js
```

`test-form.js` — empty submit flags every required field and focuses the first one; a 5-digit
phone and a malformed email are rejected; `+91 98765 43210` is accepted and reaches the success
state; the FAQ accordion opens from the keyboard.

`test-theme.js` — with no stored choice the page follows the OS; clicking the toggle flips the
attribute, the body colour and the button label; the choice survives a reload; an explicit light
choice beats a dark OS; the button is focusable.

## Design notes

**Direction — "field notebook".** Editorial serif display on warm paper, hairline rules instead
of filled bands, numbered sections, one brand colour. The page is built from rules and
whitespace rather than cards floating on tinted stripes.

**Type.** Instrument Serif for display (h1, h2, section sub-heads, prices, stats) and
Instrument Sans for everything else. The serif carries the voice; the sans carries the data.

**Colour.** Teal `#0f766e` is the single brand colour — every button, link accent and active
state. Saffron `#d9901f` is the rationed second accent: it appears about five times on the whole
page (logo flask, "most schools pick this", the winning bar in the quiz chart, the top rank).
Inside the drawn product UI, mastery meters use semantic `--ok` / `--mid` / `--bad` instead, so
the fragments read as real software rather than brand decoration.

**Theme.** The header toggle writes `localStorage.theme` and sets `data-theme` on `<html>`. With
no stored choice the page follows `prefers-color-scheme` and keeps following it live if the OS
flips. The dark tokens are declared once and applied two ways — inside the media query via
`:root:not([data-theme="light"])`, so an explicit light choice wins over a dark OS, and via
`:root[data-theme="dark"]` for an explicit dark choice. Theme resolves in a blocking inline
script before first paint, so there is no flash. With JS off the toggle is hidden (`.js-ok`) and
the media query still gives full dark mode.

**Motion.** No GSAP, no library. `IntersectionObserver` only decides *when*; CSS does the moving,
so the animation runs off the main thread while the page is still loading. Rules it follows:

- custom curves only — `--ease-out: cubic-bezier(.23, 1, .32, 1)`, never the browser defaults
- `ease-in` is never used; entering elements always ease *out*
- nothing interactive runs over 300ms; reveals are 550ms because they are marketing, not UI
- `transform` and `opacity` only
- every pressable thing scales to `.97` on `:active`
- hover effects are gated behind `@media (hover: hover) and (pointer: fine)` so a tap on a phone
  does not leave an element stuck in its hover state
- stagger is 55ms between siblings, capped at five, so a six-card grid never feels slow
- `prefers-reduced-motion` keeps the opacity fades and drops every movement — gentler, not off

**The FAQ accordion.** Native `<details>`, so it works with the keyboard and with JS off. CSS
`:has(+ details[open])` gives the split-card effect: the stack reads as one block, the open card
detaches and rounds all four corners, and its two neighbours round the edge they now face.
Height is `grid-template-rows: 0fr → 1fr`, so nothing has to be measured. JS exists only to
animate *closing* (the browser otherwise snaps `<details>` shut) and to keep one item open at a
time. `card-split-accordion.html` is the same component on its own, for reuse elsewhere.

**Mobile.** Tap highlight off, `overscroll-behavior` set so rubber-banding does not flash the
wrong colour, 16px form inputs so iOS does not zoom the page on focus, and `env(safe-area-inset-*)`
padding for notched phones.

Every product visual is drawn in HTML/CSS/SVG. There are no images on the page at all, and no
screenshots of real software.

## Before launch

Grep for `TODO` — all of them are deliberate placeholders:

- brand name, logo and `og:image` (currently "Zero" / `example.com`)
- `FORM_ENDPOINT` in `app.js` — empty, so the form validates and shows the success state
  without posting anywhere
- pricing: every `₹XXX /student /year` in the three plans
- FAQ: hosting region + retention, onboarding timeline (`[X working days]`),
  minimum bandwidth for Live Quiz
- contact details in the demo section and footer, brochure link, privacy/terms links
- the commented-out testimonials block in `index.html` — real attributed quotes only
