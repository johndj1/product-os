# New Codex Thread Grounding Prompt

Use this when starting a fresh Codex thread for Product OS.

Read these files before making changes:

- `AGENTS.md`
- `docs/product-os-grounding.md`
- `docs/startup-os/product-sources.md`
- `docs/delivery-system/feature-delivery-system.md`
- the task file currently in `tasks/active/` when one exists

You may inspect repository files before making changes.

This repository is developed using an outcome-driven and startup-driven model:

ICP -> Persona -> Journey -> Outcome -> Offer / Feature -> Task -> Code

Important:

- Product OS is both a real startup product and a reusable operating-system source for future products
- preserve current platform behavior unless a task explicitly changes it
- prefer the smallest safe implementation
- do not introduce speculative scope
- protect existing persistence, automation, and environment semantics unless the task explicitly changes them
- summarize all changes clearly and recommend a commit message

When implementing:

1. inspect the relevant repo files
2. explain your plan briefly
3. make the changes
4. run relevant validation if available
5. summarize the outcome and risks

If the task is underspecified, infer conservatively from the grounding docs rather than broadening scope.
