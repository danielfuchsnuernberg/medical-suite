// Shared by the program tests: since F2 the program opens on the sign-in screen.
// DEMO people sign in with "demo" (shown on the sign-in screen, REACH R11).
export async function signIn(page, name = "Cara Demo", password = "demo", { stay = false } = {}) {
  await page.waitForSelector('.shell, [data-testid="signin"]');
  if (await page.locator(".shell").count()) return;                    // already signed in ("stay signed in")
  const sel = page.getByLabel("Your name");
  const label = (await sel.locator("option").allTextContents()).find(t => t === name || t.startsWith(name + " · "));
  if (!label) throw new Error(`${name} is not on the sign-in list`);
  await sel.selectOption({ label });
  await page.getByLabel("Password", { exact: true }).fill(password);
  if (stay) await page.getByLabel("Stay signed in on this computer").check();
  await page.getByRole("button", { name: "Sign in" }).click();
}
