#Requires -Version 7

<#
.SYNOPSIS
    Drops the test database. The next API start recreates it from migrations and reseeds it.

.DESCRIPTION
    Isolation in this suite comes from unique data rather than teardown, so a reset is not
    needed between runs — the suite is expected to pass twice in a row without one. This
    script is for the other case: a run left the database in a state you no longer trust, or
    you want to see exactly what a fresh clone sees.

    The password is never passed in from the host. sqlcmd runs inside the container and reads
    MSSQL_SA_PASSWORD from the container's own environment, so it stays out of the host's
    process list and shell history.

.PARAMETER Database
    The database to drop. Defaults to the one the suite uses.

.PARAMETER Hard
    Destroy the container and its volume instead, forcing a completely fresh engine. Slower —
    SQL Server takes 20-40 seconds to accept connections again — but leaves nothing behind.

.EXAMPLE
    ./scripts/db-reset.ps1
    ./scripts/db-reset.ps1 -Hard
#>

[CmdletBinding()]
param(
    [string] $Database = 'LibrarySystemDb',
    [switch] $Hard
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
    if ($Hard) {
        Write-Host 'Destroying the database container and its volume...'
        docker compose down -v
        if ($LASTEXITCODE -ne 0) { throw 'docker compose down failed' }

        Write-Host 'Starting a fresh engine and waiting for it to accept connections...'
        docker compose up -d --wait db
        if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed' }
    }
    else {
        # SINGLE_USER WITH ROLLBACK IMMEDIATE evicts anything still holding a connection. An
        # API process someone forgot to stop will otherwise block the drop indefinitely,
        # and the error it gives names locks rather than the actual culprit.
        $sql = "IF DB_ID('$Database') IS NOT NULL BEGIN ALTER DATABASE [$Database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$Database]; END"

        # Single-quoted so $MSSQL_SA_PASSWORD survives PowerShell and is expanded by the
        # shell inside the container, where the value actually lives.
        $inner = '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "' + $sql + '"'

        Write-Host "Dropping $Database..."
        docker compose exec -T db bash -lc $inner
        if ($LASTEXITCODE -ne 0) { throw "Failed to drop $Database. Is the container running? Try: docker compose up -d --wait db" }
    }

    Write-Host 'Done. The next API start applies migrations and reseeds.'
}
finally {
    Pop-Location
}
