# Rebuild both single-file deliverables with the shared cross-platform verifier.
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    & node scripts/build.mjs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}
