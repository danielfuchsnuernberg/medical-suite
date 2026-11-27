// Builds docs/stage4/master-checklist.html from CHECKLIST.md › Master Feature Checklist (single source of truth).
const fs = require("fs");
const repo = process.argv[2];
const md = fs.readFileSync(repo + "/CHECKLIST.md", "utf8");
const sec = md.slice(md.indexOf("## Master Feature Checklist"));
const blocks = [];
let cur = null;
for (const line of sec.split("\n")) {
  let m;
  if ((m = /^### ((?:F\d+)|ALL) — (.+)$/.exec(line))) {
    const parts = m[2].split(" · ");
    cur = { id: m[1], name: parts[0], meta: parts.slice(1), items: [], status: "" };
    blocks.push(cur);
  } else if (cur && (m = /^- \[([ x])\] ((?:F\d+|ALL)\.\d+) (.+)$/.exec(line))) {
    let text = m[3], src = "", done = m[1] === "x", proof = "";
    const pm = / ✅ (.*)$/.exec(text); if (pm) { proof = pm[1]; text = text.slice(0, pm.index); }
    const s = /\s\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/.exec(text);
    if (s) { src = s[1]; text = text.slice(0, s.index); }
    cur.items.push({ id: m[2], text, src, done, proof });
  } else if (cur && (m = /^\*\*Status:\*\* (.+)$/.exec(line))) {
    cur.status = m[1];
  }
}
const data = JSON.stringify(blocks).replace(/</g, "\\u003c");
const tpl = fs.readFileSync(__dirname + "/template.html", "utf8");
fs.writeFileSync(repo + "/docs/stage4/master-checklist.html", tpl.replace("/*DATA*/[]", data));
console.log("blocks", blocks.length, "items", blocks.reduce((n, b) => n + b.items.length, 0));
