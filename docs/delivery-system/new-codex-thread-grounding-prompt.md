# New Codex Thread Grounding Prompt

Use this when starting a fresh Codex thread for Product OS.

Read these files before making changes:

- `AGENTS.md`
- `docs/product-os-grounding.md`
- `docs/startup-os/product-sources.md`
- `docs/delivery-system/feature-delivery-system.md`
- `docs/delivery-system/product-os-repo-workflow.md`
- the task file currently in `tasks/active/` when one exists

You may inspect repository files before making changes.

This repository is developed using an outcome-driven and startup-driven model:

ICP -> Persona -> Journey -> Outcome -> Offer / Feature -> Task -> Code

Important:

- Product OS is both a real startup product and a reusable operating-system source for future products
- work only in the Product OS repository unless a task explicitly says otherwise
- review the current branch and repo status before planning implementation
- preserve current platform behavior unless a task explicitly changes it
- prefer the smallest safe implementation
- do not introduce speculative scope
- protect existing persistence, automation, and environment semantics unless the task explicitly changes them
- summarize all changes clearly and recommend a commit message

When implementing:

1. inspect the current branch and repo status
2. inspect the relevant repo files
3. explain your plan briefly
4. make the changes
5. run relevant validation if available
6. summarize the outcome and risks

If the task is underspecified, infer conservatively from the grounding docs rather than broadening scope.
