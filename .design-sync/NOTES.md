# design-sync notes — CorioScan

Repo-specific gotchas for syncing CorioScan's component library to claude.ai/design.
Read this before every re-sync.

## What this design system actually is
CorioScan (repo package `rest-express`) is a **Vite+React app, not a published component
library**. The "design system" is the **47 shadcn/ui components** in
`client/src/components/ui/*.tsx` + the Tailwind theme (`tailwind.config.ts`,
`client/src/index.css`) + brand fonts (Hanken Grotesk / Bricolage Grotesque).
There is **no dist and no shipped `.d.ts`**, so this is a `package`-shape, synth-entry sync.

## How the build is wired (non-standard — read before touching)
The converter needs a *package* with a types entry; an app has neither. So
`.design-sync/dslib/` is a **shim package** that gives it both:
- `dslib/package.json` → `"types": "index.d.ts"` makes `PKG_DIR = dslib` (via the
  `cfg.entry` walk-up) and points the extractor at the barrel.
- `dslib/_ds_entry.tsx` (generated) → `export *` of every ui file → the bundle IIFE on
  `window.CorioScan` (all 251 exports, sub-parts included).
- `dslib/index.d.ts` (generated) → barrel re-exporting the **47 curated primaries**; this
  is what drives the component list (`exportedNames` reads it) AND lets the prop
  extractor resolve real props (incl. inline-typed components like Card via the entry
  fallback).
- `dslib/types/**` (generated) → real `.d.ts` emitted by `tsc` from the ui sources.
- `dslib/compiled.css` (generated) → the Tailwind theme compiled to a static stylesheet.

**`cfg.buildCmd` = `bash .design-sync/prebuild.sh`** regenerates all four generated
artifacts. It MUST run before the converter (the driver runs buildCmd automatically).
Config paths are relative to `dslib`: `srcDir`/`tsconfig`/`componentSrcMap` use `../../`;
`cssEntry` is `compiled.css` (must stay inside dslib — it's bounded to PKG_DIR).

### Why Tailwind is pre-compiled
shadcn components carry Tailwind utility classes and import NO css, so esbuild emits no
`_ds_bundle.css`. The converter then copies `cfg.cssEntry` (our compiled.css) verbatim
into `_ds_bundle.css`. `prebuild.sh` runs the Tailwind CLI over `client/src/components/ui/**`
**and** `.design-sync/previews/**`, then prepends the Google-Fonts `@import` (kept first so
it stays valid CSS). If a preview ever needs a Tailwind utility class not already used by a
ui component, re-run prebuild so the class is compiled in — but the house style is to use
inline styles in previews (see below), which sidesteps this entirely.

## Preview authoring conventions (validated)
- Import components from `'corioscan-ui'` (shimmed to `window.CorioScan`). Every sub-part is
  available from the root, e.g. `import { Dialog, DialogContent } from 'corioscan-ui'`.
- `lucide-react` icons import directly; `react-hook-form` (`useForm`) works for Form.
- JSX is automatic — import React only when using a hook.
- **Layout/sizing via inline `style={{}}` only**; component appearance via props. Do NOT use
  Tailwind classes in preview wrappers (the compiled stylesheet is frozen between prebuilds).
- DS tokens usable inline: `var(--primary|foreground|muted-foreground|border|success|destructive)`.
- Realistic dermatology content (lesion, case, scan, risk, patient, report) — never foo/bar.
- `AvatarFallback` (initials) over remote `AvatarImage` (flaky in headless capture).
- Vertical `Separator` needs an explicit height; `Skeleton`/`Progress`/`Slider` size via `style`.
- `Table` width goes on a wrapping `<div>`, not the `<table>`.

### Overlays need a config override (orchestrator-only)
Open overlays render via `defaultOpen`/`open` + `cfg.overrides.<Name> = {cardMode:"single",
viewport:"WxH"}`. Current set: Dialog & AlertDialog `680x440`; DropdownMenu `360x420`;
Popover `400x380`; Select `360x440`; Tooltip `340x220` (needs `TooltipProvider` wrapper).
Dialog/AlertDialog footers go horizontal only ≥640px viewport (shadcn `sm:` breakpoint).

## Known render warns (triaged legitimate — not new issues)
- `[TOKENS_MISSING]` for `--radix-*-viewport-height/width`, `--radix-accordion-content-height`,
  `--tw-shadow-color`: these are injected at runtime by Radix/Tailwind, not shipped in CSS. Expected.
- `[FONT_REMOTE]` for "Hanken Grotesk" / "Bricolage Grotesque": loaded at runtime via the
  Google-Fonts `@import` in compiled.css. Expected — fonts are not shipped in the bundle.
- A few components render short (Slider, Progress, Separator) — fine when the track/fill is styled.

## Gotchas
- **No global provider needed.** shadcn theming is CSS-class based (`.dark` + vars), not a
  ThemeProvider. Tooltip needs `TooltipProvider` composed *inside* its preview only.
- **Don't run `tsc` with a narrow `rootDir`.** An early proof-of-concept run with
  `rootDir=client/src/components/ui` emitted stray `.d.ts` next to sources outside that root
  (`client/src/lib/utils.d.ts`, `client/src/hooks/*.d.ts`). `prebuild.sh` uses
  `rootDir=client/src` so everything lands in `dslib/types/`. If stray `.d.ts` ever appear in
  `client/src`, delete them — they are not app source.
- Components: `ChartContainer`→chart.tsx and `ResizablePanelGroup`→resizable.tsx don't
  name-match their files in fuzzy src-find (harmless: `.d.ts` still resolves via the barrel;
  only JSDoc/group enrichment is skipped — group is `general` for all anyway).

## Re-sync risks (what to watch next time)
- **Adding/removing/renaming a ui component**: `prebuild.sh` auto-discovers ui files for the
  bundle entry, but the **`primary` map inside prebuild.sh** (file→primary export) is manual.
  A new component file appears in the bundle automatically but won't get a card until you add
  it to that map. Removing a file: drop it from the map too.
- **Preview content is pinned to the current shadcn API.** If a component's props change
  upstream, re-grade its preview.
- **The brand-font `@import` URL** (weights/families) is hard-coded in `prebuild.sh`; if
  `client/index.html` changes its Google-Fonts link, update prebuild.sh to match.
- **Floor-card components** (the 22 not in the core set) are the standing offer for
  incremental authoring on any future sync — authored files + grades carry forward.
