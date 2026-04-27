#Requires -Version 7

<#
.SYNOPSIS
    Collects coverage from both languages and merges it into one report.

.DESCRIPTION
    The C# suite writes Cobertura through coverlet; the TypeScript suite writes lcov through
    v8. ReportGenerator reads both and produces a single HTML report, a Markdown summary for a
    CI job summary, and a merged Cobertura file this script then gates on.

    What is measured is the two *unit* suites. The end-to-end tiers are deliberately outside
    the figure, and docs/test-strategy.md explains at length why — in short, they exercise the
    API in a separate process that no instrumentation is attached to, so a number that tried to
    include them would be measuring the wrong thing.

    Neither vite.config.ts nor the test project needed changing for this. The reporter is
    chosen on the command line and coverlet.collector was already referenced, so the system
    under test is untouched.

.PARAMETER Open
    Open the HTML report when it is finished.

.PARAMETER SkipTests
    Merge and gate whatever coverage data is already on disk, without re-running either suite.

.EXAMPLE
    ./scripts/coverage.ps1
    ./scripts/coverage.ps1 -Open
#>

[CmdletBinding()]
param(
    [switch] $Open,
    [switch] $SkipTests
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

# Thresholds are set at what is achieved today, not at what would be nice. A threshold above the
# current figure is one that fails every run until somebody lowers it, which teaches everyone to
# ignore it; a threshold far below is one nothing can ever trip. These are floors, and they are
# meant to move upwards deliberately rather than to be aspirational decoration.
$thresholds = @{
    'TOTAL'             = @{ Line = 45.0; Branch = 55.0 }
    'LibrarySystem.Api' = @{ Line = 35.0; Branch = 44.0 }
    'Default'           = @{ Line = 78.0; Branch = 59.0 }
}

$reportDir = Join-Path $repoRoot 'coverage-report'
$csharpResults = Join-Path $repoRoot 'src/LibrarySystem.Api.Tests/TestResults'
$webCoverage = Join-Path $repoRoot 'src/web/coverage'

Push-Location $repoRoot
try {
    if (-not $SkipTests) {
        # The inherited web suite is timing-sensitive and loses three tests to a machine busy
        # running SQL Server. It needs no database of its own — it mocks every request — so the
        # honest fix is not to run it against a loaded machine. Warn rather than stop: the
        # coverage figures are still produced either way.
        $dbUp = docker ps --filter 'name=librarysystem-test-db' --format '{{.Names}}' 2>$null
        if ($dbUp) {
            Write-Host 'note: the test database container is running.' -ForegroundColor Yellow
            Write-Host '      The client suite is measurably slower under that load and may lose' -ForegroundColor Yellow
            Write-Host "      three tests to it. 'npm run db:down' first for a clean measurement." -ForegroundColor Yellow
            Write-Host ''
        }

        Write-Host '==> C# coverage' -ForegroundColor Cyan
        if (Test-Path $csharpResults) { Remove-Item $csharpResults -Recurse -Force }
        dotnet test --collect:'XPlat Code Coverage' --nologo
        if ($LASTEXITCODE -ne 0) { throw 'The C# suite failed. Coverage of a failing suite is not worth measuring.' }

        Write-Host ''
        Write-Host '==> TypeScript coverage' -ForegroundColor Cyan
        Push-Location (Join-Path $repoRoot 'src/web')
        try {
            # The reporter is chosen here rather than in vite.config.ts, which belongs to the
            # vendored client and is left exactly as its own project wrote it.
            npx vitest run --coverage --coverage.reporter=lcov --coverage.reporter=text-summary
            if ($LASTEXITCODE -ne 0) { throw 'The client suite failed. See the note above about the database container.' }
        }
        finally { Pop-Location }
    }

    $cobertura = Get-ChildItem -Path $csharpResults -Recurse -Filter 'coverage.cobertura.xml' -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $cobertura) { throw "No C# coverage found under $csharpResults. Run without -SkipTests." }

    $lcov = Join-Path $webCoverage 'lcov.info'
    if (-not (Test-Path $lcov)) { throw "No client coverage found at $lcov. Run without -SkipTests." }

    Write-Host ''
    Write-Host '==> Merging' -ForegroundColor Cyan
    if (Test-Path $reportDir) { Remove-Item $reportDir -Recurse -Force }

    dotnet reportgenerator `
        "-reports:$($cobertura.FullName);$lcov" `
        "-targetdir:$reportDir" `
        '-reporttypes:Html;Cobertura;MarkdownSummaryGithub;TextSummary' `
        "-sourcedirs:$(Join-Path $repoRoot 'src');$(Join-Path $repoRoot 'src/web')" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'ReportGenerator failed.' }

    # --- the gate ----------------------------------------------------------------------------
    [xml] $merged = Get-Content (Join-Path $reportDir 'Cobertura.xml') -Raw

    $measured = [ordered] @{
        'TOTAL' = @{
            Line   = [double] $merged.coverage.'line-rate' * 100
            Branch = [double] $merged.coverage.'branch-rate' * 100
        }
    }
    foreach ($package in $merged.coverage.packages.package) {
        $measured[$package.name] = @{
            Line   = [double] $package.'line-rate' * 100
            Branch = [double] $package.'branch-rate' * 100
        }
    }

    Write-Host ''
    Write-Host 'Coverage' -ForegroundColor Cyan
    Write-Host ('  {0,-22} {1,8} {2,8}   {3}' -f 'what', 'line', 'branch', 'floor')

    $failures = @()
    foreach ($name in $measured.Keys) {
        $actual = $measured[$name]
        $floor = $thresholds[$name]

        $label = if ($name -eq 'Default') { 'librarysystem-web (TS)' } else { $name }
        $floorText = if ($floor) { '{0}% / {1}%' -f $floor.Line, $floor.Branch } else { '-' }

        $ok = (-not $floor) -or ($actual.Line -ge $floor.Line -and $actual.Branch -ge $floor.Branch)
        if (-not $ok) { $failures += $name }

        Write-Host ('  {0,-22} {1,7:N1}% {2,7:N1}%   {3}' -f $label, $actual.Line, $actual.Branch, $floorText) `
            -ForegroundColor ($ok ? 'Green' : 'Red')
    }

    Write-Host ''
    Write-Host "Report: $(Join-Path $reportDir 'index.html')"

    if ($Open) { Start-Process (Join-Path $reportDir 'index.html') }

    if ($failures.Count -gt 0) {
        throw "Coverage fell below its floor for: $($failures -join ', ')"
    }

    Write-Host 'Coverage is at or above every floor.' -ForegroundColor Green
}
finally { Pop-Location }
