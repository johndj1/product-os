# Product-OS – Grounding Context

## Overview

Product-OS is a structured system for modelling product management work in a way that links **customer value, outcomes, and delivery work**.

The goal of Product-OS is to ensure that work done by teams always traces back to **customer journeys and measurable outcomes**, rather than becoming disconnected technical tasks.

Product-OS enforces a structured hierarchy of entities that represent how product organisations actually operate.

This grounding file is a first-class source document for AI development threads in this repository. It should be committed, kept current, and read together with:

- `docs/startup-os/product-sources.md`
- `docs/delivery-system/feature-delivery-system.md`
- any active task file in `tasks/active/`

---

# Core Philosophy

Product-OS is based on three principles:

1. **Customer value drives everything**
2. **Outcomes are more important than outputs**
3. **Work should always be traceable to the user journey**

The system is designed to make product thinking explicit and structured.

---

# Entity Model

Product-OS uses a defined hierarchy of entities.

## Customer

Represents the person or group receiving value.

Examples:

- rail passenger
- retail banking customer
- internal platform engineer

---

## Persona

Represents an archetype of customer behaviour.

Example:

A commuter who regularly claims Delay Repay for disrupted journeys.

---

## Journey

Represents the end-to-end experience a user has while trying to achieve a goal.

Example:

Claim compensation for a delayed train.

---

## Journey Step

Represents an individual step within a journey.

Example:

Identify the train that was taken.

---

## Outcome

Represents the measurable result that indicates value has been delivered.

Examples:

- user identifies their train in under 5 seconds
- user successfully reaches the correct claim form

---

## Product

Represents a system or capability that delivers outcomes.

Examples:

- Check-a-Train
- Azure Landing Zone
- Internal Developer Platform

Products are **first-class entities**, not merely containers for work.

---

## Capability

Represents a functional capability delivered by a product.

Example:

Historical train search.

---

## Feature

Represents a cohesive unit of functionality that delivers a capability.

Example:

Historical service index.

---

## Story

Represents an implementable piece of work.

Stories are the lowest level of work and should always map to a Feature.

---

# Hierarchy

The intended hierarchy is:

Customer  
→ Persona  
→ Journey  
→ Journey Step  
→ Outcome  
→ Product  
→ Capability  
→ Feature  
→ Story

Every Story should ultimately map back to **customer value**.

---

# Design Principles

Product-OS enforces several rules.

### Outcome alignment

All Features must support at least one Outcome.

---

### Traceability

All Stories must trace upward to:

Feature → Capability → Product → Outcome → Journey Step.

---

### Customer-first modelling

The model starts with **customer journeys**, not engineering work.

---

### Product as a first-class entity

Products are not containers for backlog items. They represent value-delivering systems.

---

# Use Cases

Product-OS can be used for:

- product backlog structuring
- platform product management
- portfolio traceability
- outcome-based planning
- AI-assisted product reasoning

---

# Current Implementation

The repository currently focuses on:

- defining entity schemas
- building hierarchical relationships
- enabling AI agents to reason about product work
- evolving into a broader startup operating system that covers product, growth, delivery, and operational loops

Future work may include:

- CLI tooling
- automated feature creation
- analytics on outcome delivery
- integration with engineering systems

---

# How This Document Is Used

This file acts as the **grounding context for AI development threads**.

When starting a new implementation or design discussion, this file should be provided to ensure the AI assistant understands the structure and philosophy of Product-OS.

## Source Priority

When grounding a task or implementation pass, prefer this order:

1. `docs/product-os-grounding.md`
2. `docs/startup-os/product-sources.md`
3. `docs/delivery-system/feature-delivery-system.md`
4. active task file in `tasks/active/`
5. relevant implementation docs under `docs/platform/`

## Guardrail

If planning truth and implemented-platform truth differ, do not silently merge them in your head. Call out the difference, preserve current behavior unless explicitly changing it, and update the relevant source deliberately.
