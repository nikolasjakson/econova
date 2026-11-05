# Fonts

ECONOVA 2.0 self-hosts two open-source typefaces (SIL Open Font License 1.1). Place these files here:

| File | Family | Weights | Source |
|---|---|---|---|
| `SpaceGrotesk-Variable.woff2` | Space Grotesk | 300–700 | https://github.com/floriankarsten/space-grotesk |
| `Inter-Variable.woff2` | Inter | 100–900 | https://github.com/rsms/inter |

Both are loaded by the `@font-face` rules at the top of `assets/css/style.css` (Latin subset via `unicode-range`).
Also add each family's `OFL.txt` license next to the font file (for example `OFL-SpaceGrotesk.txt`, `OFL-Inter.txt`).

Until the files are present the site falls back to the system font stacks defined in `--font-body` and `--font-display`.

# Tabler Core

ECONOVA uses the locally hosted Tabler Core **1.7.3** stylesheet as its HTML/CSS component foundation:

- CSS: `assets/vendor/tabler/1.7.3/tabler.min.css`
- License and attribution: `assets/vendor/tabler/1.7.3/LICENSE.txt` (MIT)
- ECONOVA design tokens and shared responsive navigation shell: `assets/css/econova-theme.css`

The stylesheet is served from the project, so the site does not require a CDN connection. No Tabler JavaScript, Bootstrap JavaScript, icon package, or other Tabler plugin is required by the shared shell.
