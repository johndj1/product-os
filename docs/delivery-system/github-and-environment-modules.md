# GitHub And Environment Modules

## Purpose

This document describes the reusable delivery, environment, and reliability modules that Product OS should export to future repos.

## GitHub Workflow Modules

Reusable workflow patterns should be treated as modules rather than blindly copied whole.

Core modules:

- CI validation
- deploy workflow
- uptime probe
- post-deploy smoke verification
- incident creation from failed smoke or uptime checks
- investigation or remediation workflows
- security review

## Environment Modules

### Vercel

- project-per-product
- environment variable naming conventions
- deployment protection bypass pattern when used
- post-deploy health check contract
- cron ownership and monitoring

### AWS

- reusable IaC modules for storage, IAM, alarms, and databases
- per-product parameterization
- explicit environment separation
- runbook and recovery notes

## Export Rule

Each module should define:

- when to use it
- required secrets or environment variables
- validation steps
- rollback or recovery path

## Safety Rule

When rolling these modules into an existing repo:

- create missing files and folders
- skip existing files by default
- write sidecar files or merge notes when manual integration is needed
