# Switching Work To The Product OS Repo

## Why Switch

When Product OS work is done from another repo context, there is a high chance of carrying over product-specific assumptions, prompts, or architecture constraints from that other codebase.

## Recommended Move

When the focus becomes Product OS itself:

1. open a fresh Codex thread rooted in the `product-os` repository
2. use `docs/delivery-system/new-codex-thread-grounding-prompt.md`
3. make `docs/product-os-grounding.md` the first grounding source
4. treat `docs/startup-os/product-sources.md` as the operating map for startup truth
5. use `AGENTS.md` from the `product-os` repo, not from another product repo

## Practical Rule

Do not continue Product OS design or implementation work for long inside another product's thread once the work is no longer narrowly about extracting reusable patterns.

## Trigger To Switch

Switch threads when:

- the task is primarily about Product OS behavior, docs, templates, or workflows
- a decision is being made for Product OS rather than the source repo
- repo-specific assumptions from another product are starting to leak into the work
