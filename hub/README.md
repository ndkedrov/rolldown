# Hub maintenance package

This fork now ships `rolldown@1.3.0+hub.1`, tracking upstream `v1.3.0`
(including native binding versions). Its first release started at `v1.2.16`
and updated the exact `@oxc-project/types` dependency from `=0.156.0` to
`0.157.0`; those type packages have identical declaration/code files.
Upstream 1.3.0 subsequently incorporated that type update. This maintenance
release retains the explicit 0.157.0 pin and the reproducible package/test
workflow while adopting all upstream 1.3.0 changes.

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
