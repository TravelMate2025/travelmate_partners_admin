import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start -- --port 3200",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
