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

function recommendedAction(status) {
  if (status === "created") {
    return "adopt-now";
  }

  if (status === "skipped-existing") {
    return "unchanged";
  }

  return "review-manually";
}

function actionDescription(action) {
  if (action === "adopt-now") {
    return "File was added because no target file existed. Review for product-specific placeholders, then keep it as the adopted Product OS baseline.";
  }

  if (action === "unchanged") {
    return "Target already existed and the bootstrap rule preserves it. No immediate merge is required.";
  }

  return "Manual review is required before adoption. Compare the generated sidecar or missing-source result with the target repo and merge only the Product OS guidance that fits this product.";
}

function nextStep(result) {
  if (result.status === "created") {
    return "Keep as the Product OS baseline unless local product context needs a follow-up edit.";
  }

  if (result.status === "skipped-existing") {
    return "Leave unchanged; confirm the directory placeholder is still useful during normal repo cleanup.";
  }

  if (result.status === "sidecar-created") {
    return `Compare \`${result.sidecar}\` with \`${result.target}\`, merge the needed Product OS guidance manually, then delete or retain the sidecar with an explicit decision.`;
  }

  return "Source file was not found in Product OS. Check the manifest entry before rerunning bootstrap.";
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
const adoptNow = results.filter((result) => recommendedAction(result.status) === "adopt-now").length;
const reviewManually = results.filter((result) => recommendedAction(result.status) === "review-manually").length;
const unchanged = results.filter((result) => recommendedAction(result.status) === "unchanged").length;

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
  "## Action Summary",
  "",
  `- adopt-now: ${adoptNow}`,
  `- review-manually: ${reviewManually}`,
  `- unchanged: ${unchanged}`,
  "",
  "## Action Definitions",
  "",
  `- adopt-now: ${actionDescription("adopt-now")}`,
  `- review-manually: ${actionDescription("review-manually")}`,
  `- unchanged: ${actionDescription("unchanged")}`,
  "",
  "## File Results",
  ""
];

for (const result of results) {
  const action = recommendedAction(result.status);

  if (result.status === "sidecar-created") {
    reportLines.push(`- ${action} / ${result.status}: \`${result.target}\` -> \`${result.sidecar}\``);
    reportLines.push(`  - next: ${nextStep(result)}`);
    continue;
  }

  reportLines.push(`- ${action} / ${result.status}: \`${result.target}\``);
  reportLines.push(`  - next: ${nextStep(result)}`);
}

reportLines.push(
  "",
  "## Merge Review Checklist",
  "",
  "Use this checklist after bootstrap. Do not run an automated merge from this report.",
  "",
  "- `AGENTS.md`: preserve existing repo-specific agent rules, then manually add Product OS grounding, traceability, task workflow, and validation expectations that do not conflict with the target repo.",
  "- `docs/delivery-system/`: adopt these as workflow guidance. If a target repo already has delivery docs, keep implemented-platform truth intact and merge Product OS task, review, and rollout rules additively.",
  "- `docs/startup-os/templates/`: treat these as reusable templates, not product truth. Keep existing product-specific PRDs, personas, journeys, growth, finance, engineering, and operations docs separate unless a human deliberately consolidates them.",
  "- `scripts/review-active-task.mjs`: adopt this as the executable active-task review check. If the target repo already has a review script, compare behavior and keep exactly one documented command for active-task review.",
  "- `tasks/templates/`: use these to standardize future work items. If the target repo has task templates, merge required local fields with Product OS outcome, scope, acceptance, operational-readiness, and validation sections.",
  "- `tasks/backlog/`, `tasks/active/`, and `tasks/done/`: keep existing task files. Directory placeholders are unchanged when the directories already exist.",
  "",
  "## Manual Script Wiring",
  "",
  "Bootstrap does not edit `package.json` or equivalent task-runner configuration because target repos may not be Node-first and existing scripts may be product-specific.",
  "",
  "For Node-capable repos, add this script manually when it does not already exist:",
  "",
  "```json",
  "\"review:active-task\": \"node scripts/review-active-task.mjs\"",
  "```",
  "",
  "For repos that use another task runner, document the equivalent command in the repo's normal workflow docs. Rollout is incomplete until an agent can run the active-task review command without guessing.",
  "",
  "Example conflict review: if `AGENTS.new.md` exists beside `AGENTS.md`, compare the files, copy only the Product OS rules that improve traceability and delivery safety, preserve local repository constraints, then remove `AGENTS.new.md` or document why it remains.",
  "",
  "Manual review is complete when every `review-manually` item above has an explicit merge, defer, or discard decision."
);

const reportPath = path.join(targetRoot, "docs/product-os-bootstrap-report.md");
ensureDir(reportPath);
fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`);

console.log(`Bootstrap complete for ${targetRoot}`);
console.log(`Created: ${created}, sidecars: ${sidecars}, skipped: ${skipped}, missing-source: ${missing}`);
console.log(`Report written to ${reportPath}`);
