# Zero — marketing landing page

Standalone static marketing site. No build step, no dependencies to install, no framework.
GSAP + ScrollTrigger and one Google font (Figtree) load from CDN; everything else — layout,
illustrations, form logic — is local and inline.

```
index.html     the whole page
styles.css     design tokens, layout, dark mode
app.js         theme toggle, GSAP scroll motion, demo form validation (FORM_ENDPOINT at the top)
test-form.js   runnable check for the form + accordion
test-theme.js  runnable check for the theme toggle
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

The palette is the product app's own: cream/brown light theme (`#fdf3e3` page, `#fdf3d8` cards,
`#B8843A` borders, `#1a0f00`/`#5c3d1e`/`#7a5230` text), near-black dark theme (`#111`/`#1a1a1a`,
`#e5e7eb` text, `rgba(255,255,255,.15)` borders).

Theme: the header toggle writes `localStorage.theme` and sets `data-theme` on `<html>`. With no
stored choice the page follows `prefers-color-scheme` and keeps following it live if the OS
flips. The dark tokens are declared once and applied two ways — inside the media query via
`:root:not([data-theme="light"])`, so an explicit light choice wins over a dark OS, and via
`:root[data-theme="dark"]` for an explicit dark choice. Theme is resolved in a blocking inline
script before first paint, so there is no flash. With JS off the toggle is hidden (`.js-ok`)
and the media query still gives full dark mode.

The brand gradient (`#FF3B6D → #FF9500`) is deliberately rationed to about five places on the
page. Inside the drawn product-UI fragments, mastery meters use the app's semantic accents
(`--ok` green / `--mid` amber / `--bad` red) instead, which is what stops the page reading as
template output.

Every product visual is drawn in HTML/CSS/SVG. There are no images on the page at all, and no
screenshots of real software.

## Before launch

Grep for `TODO` — all of them are deliberate placeholders:

- brand name, logo and `og:image` (currently "Zero" / `example.com`)
- `FORM_ENDPOINT` in `app.js` — empty, so the form validates and shows the success state
  without posting anywhere
- pricing: every `₹XXX /student /year` in the pricing table *and* the mobile pricing cards
- FAQ: hosting region + retention, onboarding timeline (`[X working days]`),
  minimum bandwidth for Live Quiz, training format and support hours
- contact details in the demo section and footer, brochure link, privacy/terms links
- the commented-out testimonials block in `index.html` — real attributed quotes only
