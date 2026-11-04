# Portfolio archive

- `v1`: `fc8e3c5629fe5de6c3e360cd2c0b2df73fff6813`
- `v2`: `08f9a3e16d7fd66335ea6799b374790e8e9f8281`
- `v3`: the current portfolio at the site root.

Rebuild from the repository root with `node scripts/export-portfolio-versions.cjs`.
The exporter reads Git blobs without changing the checkout. It excludes editor
settings, exports the original HTML/CSS/JS, adjusts local media URLs, and adds
the version switcher. Media identical to the current root files are shared;
missing or different historical media are preserved under `versions/assets/`.
Run the exporter again if shared root media are replaced or removed.

The archive pages use their own historical styles and navigation. The small
version button is the route back to v3. No build server or GitHub connection is
needed to browse the exported pages.
