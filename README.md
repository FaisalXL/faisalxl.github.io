# faisal — portfolio

A single-page personal site. Hand-written HTML, CSS, and JavaScript — no framework, no build
step, no dependencies. Editing it means editing `index.html`.

## Files

| File | What it holds |
|---|---|
| `index.html` | All the content. This is the file to edit. |
| `styles.css` | Every visual decision, ordered to match the page. |
| `script.js` | Theme toggle, wordmark animation, copyright year. |
| `Faisal-CV.pdf` | The CV the header and footer link to. |
| `tools/check-contrast.py` | Palette accessibility test. Run it after any color change. |
| `tools/serve.py` | Local preview server that doesn't cache. Dev only. |
| `tools/prepublish-check.sh` | Run before every push; blocks private details from going public. |

## Preview locally

```sh
python3 tools/serve.py
```

Then open <http://localhost:8080>. Pass a port to use a different one: `python3 tools/serve.py 9000`.

Use this rather than `python3 -m http.server`. The built-in server sends no cache headers at all, so
the browser applies its own heuristic freshness and will happily serve you a stale `styles.css` or
`script.js` after you've edited it — you reload and nothing changes. `tools/serve.py` is the same
static server with `Cache-Control: no-store`, so edits always show. It's a local editing convenience
and has nothing to do with how the site is deployed.

## Adding an entry

Copy an existing `<article class="row">` block in `index.html` and edit the text. The layout comes
from the classes, so a new entry needs no CSS.

```html
<article class="row">
  <div class="row-meta mono">2027<br class="meta-break"><span>Los Angeles</span></div>
  <div class="row-body">
    <h2 class="row-title">Thing <em>· Place</em></h2>
    <p class="row-role mono">Your role</p>
    <p>What you built and what came of it.</p>
    <p class="tags mono"><span>Python</span><span>Something</span></p>
  </div>
</article>
```

The `<br class="meta-break">` is what lets the years and the location collapse onto one line on
phones. If an entry has only one piece of metadata (like the project rows), drop the `<br>` and the
`<span>` and just write the date.

## Changing colors

Every color is a custom property at the top of `styles.css`, under `--l-*` (light) and `--d-*`
(dark). Change the values there and nowhere else — the rest of the stylesheet only refers to the
active `--bg`, `--ink`, `--dim`, `--muted`, `--accent` names.

After any color change:

```sh
python3 tools/check-contrast.py
```

It fails if any text/background pair drops below WCAG AA (4.5:1). All the metadata on this site
renders at 10–11px, so that threshold applies to every pair — there's no large-text exemption to
fall back on.

Margins are comfortable everywhere except light-mode `--muted`, which sits at 4.86:1. Two ways to
break it: lighten `--muted`, or **darken `--l-bg`**. The second is the counterintuitive one —
`--muted` is darker than the background, so darkening the ground moves the two closer together and
*reduces* contrast. They have to move as a pair.

**Judge colours on an unfiltered display.** Night Shift, f.lux, and similar blue-light filters warm
and dim everything, which makes this ivory read as flatter and darker than it is. A palette tweak
made under a filter will look wrong once it's off.

## Publishing

The site is served by GitHub Pages from `main` of `FaisalXL/faisalxl.github.io`, at
<https://faisalxl.github.io>. There's no build step: whatever is committed on `main` is the site.
`.nojekyll` tells Pages to serve the files as they are.

Before every push:

```sh
sh tools/prepublish-check.sh
```

It fails if a published PDF contains a phone number, if private working notes have ended up in a
tracked file, or if the palette no longer passes the contrast check. When it says OK:

```sh
git push
```

The live site updates a minute or two later.

To use your own domain later, add a `CNAME` file containing the domain and point a DNS record at
GitHub. Nothing in the site depends on the hostname.

## Accessibility notes

Worth preserving if you change things:

- The full name `faisal` lives in the HTML. `script.js` only reveals it character by character — it
  never injects the text. With JavaScript off, the name renders complete.
- The animated character spans are `aria-hidden`; the link carries its own `aria-label`.
- Everything animated is suppressed under `prefers-reduced-motion: reduce`, including the theme
  transition (view-transition pseudo-elements need their own rule — the blanket `*` rule doesn't
  reach them).
- The theme switch uses the View Transitions API to expand a circle out of the toggle button.
  Browsers without it (Firefox before 129, older Safari) just switch instantly, which is a fine
  outcome — don't add a polyfill for it.
- `#year` ships with `2026` hardcoded so the footer is never blank without JS.
- **Measures are in px, not `ch`.** `62ch` is a different pixel width in every font, so a
  `ch`-based measure rewraps the text when the webfont swaps in — and `size-adjust` can't fix it,
  because it scales the `ch` unit and the glyphs by the same amount. `606px` is what `62ch` resolved
  to in Inter at 15.5px, and `512px` is `58ch` at 14px. If you change a font, remeasure these.
- The `@font-face` blocks at the top of `styles.css` wrap local system fonts and rescale them to
  match Inter and Plex, so nothing moves when the webfonts arrive. Measured shift is 0px; without
  them it was 49px.
