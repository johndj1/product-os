import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const activeTasksDir = path.join(repoRoot, "tasks", "active");
const requiredSections = [
  "## Status",
  "## Parent feature",
  "## Intended outcome",
  "## Persona",
  "## Journey",
  "## Context",
  "## Scope",
  "## Constraints",
  "## Acceptance criteria",
  "## Operational readiness",
  "## Implementation notes",
  "## Validation",
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const entries = await readdir(activeTasksDir, { withFileTypes: true });
const taskFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();

if (taskFiles.length !== 1) {
  fail(
    `review:active-task expects exactly one markdown task in tasks/active. Found ${taskFiles.length}: ${taskFiles.join(", ") || "none"}.`
  );
} else {
  const activeTaskName = taskFiles[0];
  const activeTaskPath = path.join(activeTasksDir, activeTaskName);
  const content = await readFile(activeTaskPath, "utf8");
  const missingSections = requiredSections.filter((section) => !content.includes(section));
  const hasChecklist = /## Acceptance criteria[\s\S]*- \[ \]/.test(content);
  const hasValidationType = /Task type:\s*(product behavior change|workflow-only|doc-only)/.test(
    content
  );

  console.log(`Active task: tasks/active/${activeTaskName}`);

  if (missingSections.length > 0) {
    fail(`Missing required sections: ${missingSections.join(", ")}`);
  }

  if (!hasChecklist) {
    fail("Acceptance criteria must include at least one unchecked checklist item.");
  }

  if (!hasValidationType) {
    fail("Validation must include a supported task type.");
  }

  if (process.exitCode !== 1) {
    console.log("Active task structure looks valid.");
    console.log("Next: implement the task, run its named validation, and move it to tasks/done when complete.");
  }
}
