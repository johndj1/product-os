# Delivery And Reliability System

## Purpose

This document defines the engineering and SRE operating construct Product OS should use and export to other products.

## Delivery Construct

Product OS should adopt the same strong repo-driven loop proven elsewhere:

- context and source-of-truth docs
- thin backlog tasks
- one active task by default
- explicit validation rules
- close-out review contract
- docs impact check
- low-blast-radius changes

## Required Delivery Assets

- `AGENTS.md` or equivalent agent grounding rules
- product context and product sources docs
- architecture and decision logs
- `tasks/backlog`, `tasks/active`, `tasks/done`
- task templates
- CI validation
- deploy workflow
- smoke and incident flow where applicable

## Reliability Construct

Every product using this operating system should define:

- health endpoint contract
- deployment target and environment model
- uptime probe
- smoke verification for customer-critical journeys
- incident creation path
- recovery path and runbook notes
- observability expectations

## Vercel And AWS Direction

### Vercel

- project-per-product
- environment variables as the source of truth
- health checks and smoke gates
- deployment workflows with explicit post-deploy verification

### AWS

- infrastructure should be described as reusable modules
- services should be parameterized per product
- alarms, storage, IAM, and database constructs should be standardized where practical

## Export Rule

Engineering and SRE patterns should be turned into reusable templates and bootstrap scripts only after they are proven in at least one real product repo.
