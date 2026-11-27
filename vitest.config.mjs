import { defineConfig } from "vitest/config";

// Fixed time zone and locale, so every date in a unit test is a known value.
// The base time zone itself comes from the country settings (R12); the tests pass it in.
process.env.TZ = "Pacific/Port_Moresby";
process.env.LC_ALL = "en_AU.UTF-8";

export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.test.ts"],
  },
});
