import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path"; import fs from "node:fs"; import os from "node:os"; import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";
// B60: the installed program itself (after `npm run dist:mac -w apps/desktop`). Skipped when no app has been built.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const exe = path.join(ROOT, "apps/desktop/release/mac-arm64/REACH Medical Suite.app/Contents/MacOS/REACH Medical Suite");
test("B60 the packaged Mac app opens, signs in and shows its screens, with no errors", async () => {
  test.skip(!fs.existsSync(exe), "no packaged app built");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-pkg-"));
  const app = await electron.launch({ executablePath: exe, env: { ...process.env, MD_TEST: "1", MD_USER_DATA: dir } });
  const page = await app.firstWindow();
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await signIn(page, "Cara Demo"); await page.waitForSelector(".shell");
  for (const v of ["overview", "where", "cd", "staff", "log", "settings"]) { await page.click(`.side [data-view="${v}"]`); await page.waitForTimeout(150); }
  await page.click('.side [data-view="overview"]');
  await page.screenshot({ path: path.join(ROOT, "docs/stage8/packaged-mac.png") });
  expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
  expect(errors).toEqual([]);
  await expect(page).toHaveTitle("REACH Medical Suite");
  await app.close();
});
