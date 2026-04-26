import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// The database connection string lives in .env, which is git-ignored; .env.example is the
// committed template. Loading it here is what makes `npm run test:e2e` work straight after
// `npm run db:up`, with nothing exported by hand.
//
// Node reads the file natively, so there is no dotenv dependency, and loadEnvFile leaves a
// variable that is already set alone - an exported value, CI's or a one-off, still wins over
// the file.
if (existsSync('.env')) {
  process.loadEnvFile()
}

const connectionString = process.env.ConnectionStrings__DefaultConnection

if (!connectionString) {
  // Stop here, with the fix in the message, rather than let two servers and every test spend
  // their timeouts failing to reach a database nobody pointed them at.
  throw new Error(
    'ConnectionStrings__DefaultConnection is not set. Copy .env.example to .env - the values ' +
      'in it are throwaway local credentials - or export the variable yourself.',
  )
}

// The two servers the suite talks to, both started and stopped by Playwright below.
const apiUrl = 'http://localhost:5018'
const webUrl = 'http://localhost:4173'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,

  // A stray test.only turns a CI run into one passing test and a green tick.
  forbidOnly: isCI,

  // Retries absorb infrastructure noise on a shared runner. They are not a way to make a flaky
  // test look green: locally there are none, so a failure is visible the first time it happens.
  retries: isCI ? 2 : 0,

  // The HTML reporter opens a browser and blocks the terminal on failure by default, which is
  // hostile to any scripted run. Open it deliberately with `npm run test:e2e:report`.
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: webUrl,

    // Evidence, kept only where it is worth having: a trace for a failure that survived its
    // first retry, and a screenshot and video for any failure at all.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  expect: {
    // Raised from the 5s default because this suite runs, by definition, on a machine also
    // running a SQL Server container - which measurably slows everything else down. Unlike a
    // one-shot query, a web-first assertion polls, so a longer timeout only changes how long it
    // waits before failing; it cannot make a wrong assertion pass.
    timeout: 10_000,
  },

  projects: [
    {
      // HTTP-level tests, no browser. They talk to the API directly rather than through the
      // client's proxy, because what they are testing is the API.
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: apiUrl },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], baseURL: webUrl },
    },
    {
      // Accessibility scans, kept as their own project so they can be run - or skipped - on
      // their own. They are the slowest tests here and the ones whose results are read rather
      // than merely counted.
      name: 'a11y',
      testDir: './tests/a11y',
      use: { ...devices['Desktop Chrome'], baseURL: webUrl },
    },
  ],

  webServer: [
    {
      // Build first, then launch the built assembly. `dotnet run` starts the application as a
      // child process, which survives the stop signal and keeps port 5018 - and a held port
      // also locks LibrarySystem.Api.dll, so the next build fails with MSB3027, an error that
      // names a file rather than the process holding it.
      //
      // A bare `dotnet <assembly>.dll` does not read launchSettings.json, so without
      // ASPNETCORE_URLS the host would bind its default port 5000 and the wait below would
      // time out against nothing. The URL is set here, in the one place that also states it.
      command:
        'dotnet build src/LibrarySystem.Api --nologo -v quiet && dotnet src/LibrarySystem.Api/bin/Debug/net9.0/LibrarySystem.Api.dll',
      env: {
        ASPNETCORE_URLS: apiUrl,
        ConnectionStrings__DefaultConnection: connectionString,
      },

      // /health is backed by a database check, so waiting on it means "ready to serve a request
      // that touches data" rather than "the process started". Polling a domain endpoint instead
      // would conflate being ready with having data.
      url: `${apiUrl}/health`,

      // Generous, because the first start of a cold database applies migrations and seeds. It
      // costs nothing in the common failure: a server that exits is reported at once, not
      // waited out.
      timeout: 180_000,
      reuseExistingServer: !isCI,
    },
    {
      // The production bundle, served by Vite's preview server - the artifact that actually
      // ships, not the dev server. preview.proxy defaults to server.proxy, so /api is already
      // forwarded to the API and the whole thing is same-origin; the client needs no change and
      // the API needs no CORS policy.
      //
      // --strictPort matters: without it Vite quietly picks 4174 when 4173 is taken, and the
      // wait below would then hang on a port nothing will ever answer.
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      cwd: 'src/web',
      url: webUrl,
      timeout: 180_000,
      reuseExistingServer: !isCI,
    },
  ],
})
