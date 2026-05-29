# Product OS PRD

## Product

- Name: Product OS
- Type: AI-native startup operating system
- Primary mode: repo-native system for turning product truth into executable delivery and engineering follow-through

## Product Structure

Product OS has two tightly linked layers:

- `Product OS`: the live product and operator experience used to define product truth, review execution state, and prove the operating model in real use
- `product-os-core`: the reusable build, bootstrap, delivery, and engineering layer that Product OS uses itself before those capabilities are rolled into other repos

The product may later be packaged with a SaaS surface, but the current canonical model is repo-first:

- product truth lives in markdown docs
- execution lives in markdown tasks under `tasks/`
- UI is a rendering and assistance layer, not the primary source of truth

## Problem

Founders and small product teams often run product, engineering, GTM, and operating decisions across disconnected docs, chats, spreadsheets, tickets, and AI threads.

That creates five recurring failures:

- strategy does not survive handoff into delivery
- customer insight does not reliably shape roadmap decisions
- operational signals do not turn into structured follow-up work
- startup execution depends too heavily on founder memory
- AI agents work against partial or stale context instead of explicit repo-local truth

Traditional backlog tools make this worse by encouraging teams to push more context into individual work items instead of preserving value drivers in stable product documents.

## Product Vision

Product OS becomes the operating system a startup uses to:

- define who it serves
- understand what problem it is solving
- shape compelling offers
- validate demand quickly
- route learning into backlog, delivery, and engineering systems
- connect delivery, growth, and operational evidence in one repo-native system

The key model is:

1. AI and product owners define durable product truth in docs
2. agents scrutinize that truth and derive implementation-sized markdown tasks
3. one active task is executed at a time through a deterministic review loop
4. the same system scaffolds repo structure, pipelines, environments, and test harnesses through `product-os-core`

## Primary Outcome

Reduce the time and friction from product intent to safe aligned action across product, growth, engineering, and operations.

## Users

- founder-operator
- full-stack product owner
- engineering lead in an early-stage team
- AI-assisted delivery agent acting inside a repo-backed operating model

## Core Product Thesis

Product OS should not try to win by becoming a better ticket database.

It should win by:

- keeping value, ICP, persona, journey, and outcome context in durable product docs
- generating thin executable backlog tasks from that context instead of duplicating it into every work item
- making repo-local markdown the canonical contract for both humans and agents
- turning product truth into working delivery and engineering scaffolding rather than stopping at planning artifacts

## In Scope

- product and startup operating documentation
- repo-native markdown task and decision management
- product-doc-driven backlog construction and prioritization
- product graph and delivery graph visibility where it helps operators understand the markdown source of truth
- signal ingestion and follow-up work creation
- startup planning artifacts for validation, GTM, and operations
- delivery and engineering scaffolding through `product-os-core`
- repo bootstrap for docs, tasks, pipelines, environments, and test harness expectations

## Out Of Scope For Now

- full CRM replacement
- enterprise BI
- complex financial accounting
- broad autonomous decision-making without human review
- replacing the repo-native source-of-truth model with a SaaS-only data model
- deep workflow customization for every possible target repo before the core loop proves itself

## Product Principles

- customer value before internal neatness
- evidence before scaling
- fast loops over heavyweight process
- explicit traceability from market signal to shipped work
- startup pragmatism over theatre
- docs are durable context; tasks are thin execution contracts
- prove patterns in Product OS before exporting them through `product-os-core`
- prefer deterministic workflow and review loops over opaque automation

## Canonical Operating Model

### Product truth layer

- PRD, ICP, personas, journeys, offer, validation, roadmap, and operating constraints
- slow-moving, high-signal, versioned in-repo

### Execution layer

- `tasks/backlog`, `tasks/active`, `tasks/done`
- implementation-sized markdown task files
- one-active-task-by-default workflow
- explicit validation and close-out review

### Core delivery and engineering layer

- bootstrap assets
- repo scaffolding
- delivery scripts
- pipeline and environment contracts
- test harness and smoke expectations

## MVP

The MVP is not a full work-management application. It is a repo-native operating loop that proves Product OS can turn product truth into executable delivery.

MVP scope:

1. product doc pack for Product OS itself
2. markdown backlog system with backlog, active, and done
3. task-generation and review-loop rules that agents can execute safely
4. safe bootstrap into an existing repo without overwrite
5. minimal rendering UI for people who want a clearer view of docs and tasks
6. basic delivery and engineering starter assets through `product-os-core`

## Iteration Model

Product OS must support use by itself and by other repos at the same time.

The operating rule is:

- prove in Product OS first
- then promote into `product-os-core`
- then roll out to other repos with explicit safety and merge rules

Capability states:

1. draft in Product OS
2. proven in Product OS
3. exportable through `product-os-core`

This lets Product OS act as the live proving ground and a staging or pre-production environment for the reusable core without forcing every experimental change onto downstream repos.

## SaaS Positioning Guardrail

A future SaaS version is compatible with this model if it renders, assists with, and orchestrates repo-native truth rather than replacing it silently.

The repo remains the canonical operating substrate until there is clear evidence that a different truth model creates more value than risk.

## Success Indicators

- fewer strategy-to-delivery translation gaps
- shorter time from identified opportunity to validated change
- clearer link between customer learning, roadmap, and released work
- agents can execute more work from local context with fewer clarifications
- Product OS successfully dogfoods new core capabilities before rollout elsewhere
- reusable operating system that can be rolled into future products with low setup cost and low overwrite risk
