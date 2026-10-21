# Releasing

Each publishable segment gets a package version and changelog entry. Never point a new release at an old EXE. Keep previous releases available for rollback.

1. Update version, rule version and changelog; build both HTML files.
2. Run `npm run verify` (Node.js22+ and Python3.12+), inspect changes, commit and push main. This includes real loopback HTTP/port/lifecycle tests; mocked window failures do not claim full native GUI interaction coverage.
3. Create `v<package-version>` at that exact clean commit and push that tag.
4. `release.yml` reruns verification on Windows, builds the desktop binary with pinned tools/Python3.12, runs its `--self-test`, generates checksums and only then publishes the GitHub Release.
5. Read back release tag and assets. CI packaging failure means no successful release; inspect and fix, do not substitute an older executable.

The desktop self-test verifies embedded HTML delivery and loopback server startup/shutdown. It is not a manual interaction test of every native WebView window or a signed/notarized binary. Releases currently provide Windows x64, not native Linux/macOS packages.
