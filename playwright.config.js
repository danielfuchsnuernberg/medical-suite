// Tests run against the real program (Electron), one test per Master Checklist line.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/app",
  timeout: 30000,
  workers: 1,
  reporter: [["list"]],
});
