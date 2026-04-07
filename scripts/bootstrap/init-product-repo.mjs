import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const manifestPath = path.join(rootDir, "scripts/bootstrap/bootstrap-manifest.json");

function usage() {
  console.error("Usage: npm run bootstrap:product-repo -- /absolute/path/to/target-repo");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sidecarPath(targetPath) {
  const ext = path.extname(targetPath);
  if (!ext) {
    return `${targetPath}.new`;
  }

  const base = targetPath.slice(0, -ext.length);
  return `${base}.new${ext}`;
}

const targetArg = process.argv[2];

if (!targetArg) {
  usage();
  process.exit(1);
}

const targetRoot = path.resolve(targetArg);

if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
  console.error(`Target repo does not exist or is not a directory: ${targetRoot}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const results = [];

for (const entry of manifest.entries) {
  const sourcePath = path.join(rootDir, entry.source);
  const targetPath = path.join(targetRoot, entry.target);

  if (!fs.existsSync(sourcePath)) {
    results.push({
      target: entry.target,
      status: "missing-source"
    });
    continue;
  }

  if (!fs.existsSync(targetPath)) {
    ensureDir(targetPath);
    fs.copyFileSync(sourcePath, targetPath);
    results.push({
      target: entry.target,
      status: "created"
    });
    continue;
  }

  if (entry.onConflict === "skip") {
    results.push({
      target: entry.target,
      status: "skipped-existing"
    });
    continue;
  }

  const fallbackTarget = sidecarPath(targetPath);
  ensureDir(fallbackTarget);
  fs.copyFileSync(sourcePath, fallbackTarget);
  results.push({
    target: entry.target,
    status: "sidecar-created",
    sidecar: path.relative(targetRoot, fallbackTarget)
  });
}

const created = results.filter((result) => result.status === "created").length;
const sidecars = results.filter((result) => result.status === "sidecar-created").length;
const skipped = results.filter((result) => result.status === "skipped-existing").length;
const missing = results.filter((result) => result.status === "missing-source").length;

const reportLines = [
  "# Product OS Bootstrap Report",
  "",
  `Target repo: \`${targetRoot}\``,
  "",
  "## Summary",
  "",
  `- created: ${created}`,
  `- sidecar-created: ${sidecars}`,
  `- skipped-existing: ${skipped}`,
  `- missing-source: ${missing}`,
  "",
  "## File Results",
  ""
];

for (const result of results) {
  if (result.status === "sidecar-created") {
    reportLines.push(`- ${result.status}: \`${result.target}\` -> \`${result.sidecar}\``);
    continue;
  }

  reportLines.push(`- ${result.status}: \`${result.target}\``);
}

const reportPath = path.join(targetRoot, "docs/product-os-bootstrap-report.md");
ensureDir(reportPath);
fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`);

console.log(`Bootstrap complete for ${targetRoot}`);
console.log(`Created: ${created}, sidecars: ${sidecars}, skipped: ${skipped}, missing-source: ${missing}`);
console.log(`Report written to ${reportPath}`);
