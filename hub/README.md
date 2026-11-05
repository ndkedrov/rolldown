# Hub maintenance package

This fork starts at upstream `v1.2.16` and ships `rolldown@1.2.16+hub.1`.
It changes the exact `@oxc-project/types` dependency from `=0.156.0` to
`0.157.0`. The published packages have identical declaration/code files;
only their package metadata differs. Native bindings remain upstream 1.2.16.

The release uses a verified upstream npm tarball, preserving every runtime
file instead of recompiling unchanged Rust or generated JavaScript. The
packager checks the upstream SHA-512 before extraction. It records the source
commit and original integrity in `hub-provenance.json` inside the tarball.

With Python 3.12+ and npm installed:

```sh
python3 hub/build-package.py
# In an isolated installation containing the resulting tarball:
node /absolute/path/to/hub/test-package.mjs /absolute/path/to/installation
```

The artifact test executes TypeScript inputs, ESM/CommonJS output, dynamic
imports, plugin hooks and source maps. The normal upstream build still uses
its pnpm workspace; the maintenance artifact is built by the script above.
Do not change native binding versions to the fork's metadata version.

Hub consumers pin the release asset URL and its integrity in package-lock.json.
Future upstream versions must continue to appear in dependency reports.
