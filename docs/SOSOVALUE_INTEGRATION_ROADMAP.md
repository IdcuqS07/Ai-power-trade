# SoSoValue Integration Roadmap

## Purpose

This roadmap is the working contract for integrating SoSoValue into AI Power Trade in a disciplined way.

Primary objective:
- turn AI Power Trade from a signal-only trading dashboard into a research-to-execution product with SoSoValue-powered market context

Secondary objective:
- prepare a clean Buildathon-ready submission with a real user flow from insight to action

## Product Thesis

AI Power Trade already has:
- live price ingestion
- AI signal generation
- confidence scoring
- dashboard UX
- simulated and blockchain-linked trading flows

SoSoValue adds the missing layer:
- structured news and market intelligence
- asset-linked research context
- ETF and macro regime signals
- index and thematic context

Target product positioning:
- AI Power Trade x SoSoValue = Research-to-Execution Copilot

## Scope

### In Scope

- SoSoValue API integration on the backend
- symbol to currency mapping
- research/news ingestion and normalization
- ETF and macro regime context
- catalyst scoring for supported assets
- signal fusion with current AI models
- dashboard and AI prediction UX upgrades
- Buildathon demo materials and documentation

### Out of Scope for Initial MVP

- full autonomous trading without user confirmation
- raw frontend calls to SoSoValue with exposed keys
- broad multi-chain refactor
- full SoDEX signed execution on day one

### Optional Bonus Scope

- SoDEX read-only market integration
- SoDEX execution with signed orders
- thematic/index-aware watchlists

## Working Principles

1. Backend-first integration. No SoSoValue secret or private auth logic in the frontend.
2. Cache by default. News and research endpoints must not be fetched on every page load.
3. Additive rollout. Existing Binance/CoinGecko flows stay alive while SoSoValue is layered in.
4. Feature-flag new capabilities until each phase is verified.
5. Every phase must end with a demoable output.
6. Every new score shown to users must be explainable.
7. Trading action must keep risk controls and explicit confirmation.

## Current Repo Touchpoints

These are the main files we will extend first:

- `comprehensive_backend/main.py`
- `comprehensive_backend/enhanced_predictor.py`
- `comprehensive_frontend/pages/index.js`
- `comprehensive_frontend/pages/ai-predictions.js`
- `comprehensive_frontend/pages/api/dashboard.js`
- `comprehensive_frontend/pages/api/market/prices.js`

New files likely to be added:

- `comprehensive_backend/sosovalue_api.py`
- `comprehensive_backend/sosovalue_service.py`
- `comprehensive_backend/sosovalue_cache.py` or shared cache helper
- `comprehensive_frontend/components/ResearchFeedPanel.js`
- `comprehensive_frontend/components/SignalRationalePanel.js`
- `comprehensive_frontend/components/MacroRegimeCard.js`
- `SOSOVALUE_INTEGRATION_NOTES.md`

## Target Architecture

```text
SoSoValue API
    |
    v
Backend adapter + cache + normalization
    |
    +--> research context
    +--> asset news feed
    +--> ETF / macro regime
    +--> catalyst score
    |
    v
Enhanced predictor fusion layer
    |
    +--> final signal
    +--> confidence
    +--> rationale
    +--> confirmation requirements
    |
    v
Frontend dashboard and AI prediction pages
    |
    +--> explain why
    +--> show catalysts
    +--> show market regime
    +--> route to execution
```

## Delivery Phases

## Phase 0 - Access, Constraints, and Design Lock

### Goal

Confirm the exact SoSoValue endpoints, access conditions, supported assets, and MVP use case before implementation starts.

### Tasks

- request Buildathon access if needed
- confirm API authentication model and rate limits
- identify the exact endpoints needed for:
  - listed currencies
  - featured news feed
  - featured news by currency
  - ETF metrics
- define the supported asset universe for MVP
- define the first user story:
  - user selects asset
  - user sees signal plus research context
  - user gets recommended action with explanation
- define env vars and secret storage plan
- define feature flag names

### Deliverables

- finalized MVP use case statement
- approved endpoint list
- env var contract
- feature flag contract

### Acceptance Criteria

- we know exactly which API calls we will make in Phase 1
- we know which symbols are supported in the first release
- we have a documented fallback when SoSoValue data is unavailable

## Phase 1 - Backend Adapter Foundation

### Goal

Create a clean, testable backend integration layer for SoSoValue without touching signal logic yet.

### Tasks

- add `sosovalue_api.py` client wrapper
- centralize auth header generation and request handling
- add request timeout and error normalization
- add cache policy per endpoint
- add symbol to currency mapping loader
- expose internal helper methods for:
  - fetch listed currencies
  - fetch featured news
  - fetch news by currency
  - fetch ETF metrics
- wire env vars:
  - `SOSO_API_KEY`
  - optional `SOSO_BASE_URL`
  - feature flag such as `ENABLE_SOSOVALUE`

### Deliverables

- backend SoSoValue client
- normalized response shapes
- cache strategy
- smoke-test script or local verification notes

### Acceptance Criteria

- backend can fetch and return valid SoSoValue data from at least 3 required endpoints
- failures degrade gracefully and do not break existing dashboard endpoints
- no SoSoValue secrets appear in frontend code

## Phase 2 - Research Intelligence Layer

### Goal

Transform raw SoSoValue data into usable product intelligence.

### Tasks

- build `symbol -> currencyId` mapping service
- normalize article objects into a compact internal shape
- create research summary model:
  - headline
  - source
  - publish time
  - related asset
  - sentiment hint
  - importance score
- create ETF regime model:
  - bullish
  - neutral
  - defensive
- create catalyst scoring logic using:
  - article recency
  - article relevance to asset
  - number of high-signal items
  - ETF regime overlay for BTC/ETH market context
- define a clear explanation field for each derived score

### Deliverables

- research context service
- catalyst score service
- ETF regime service
- normalized response examples

### Acceptance Criteria

- given a supported symbol, backend returns:
  - latest relevant news
  - catalyst score
  - human-readable rationale
  - ETF regime context
- the result is deterministic enough to demo repeatedly

## Phase 3 - Signal Fusion

### Goal

Blend SoSoValue context into the current prediction engine instead of showing it as a disconnected side panel.

### Tasks

- extend `enhanced_predictor.py`
- add new signal inputs:
  - technical score
  - ML score
  - SoSo research score
  - macro regime score
- design fusion rules:
  - support confirmation logic
  - reduce confidence when research contradicts the model
  - boost confidence when research and model agree
- add fields to the final prediction payload:
  - `research_score`
  - `macro_score`
  - `catalyst_score`
  - `signal_alignment`
  - `confirmation_required`
  - `rationale_summary`
- keep existing fields backward compatible

### Deliverables

- upgraded enhanced predictor
- new response contract for frontend
- documented signal fusion rules

### Acceptance Criteria

- `/api/dashboard` and enhanced AI endpoints can return fused intelligence
- final signal remains explainable
- existing frontend does not crash if new fields are missing

## Phase 4 - Dashboard UX Integration

### Goal

Expose SoSoValue-powered context in a way that increases user trust and actionability.

### Tasks

- add dashboard cards for:
  - market regime
  - top catalyst
  - research confidence
  - latest asset-linked news
- add "Why this signal?" panel
- add concise labels:
  - confirmed by research
  - contradicted by research
  - waiting for confirmation
- upgrade AI prediction page with:
  - research feed
  - catalyst timeline
  - market regime box
  - fused confidence display
- add loading, error, and stale-data states
- add clear copy for fallback mode when SoSoValue is unavailable

### Deliverables

- integrated dashboard experience
- upgraded prediction page
- reusable frontend components

### Acceptance Criteria

- a user can understand why the platform suggests BUY, SELL, or HOLD
- a user can distinguish raw model confidence from research-confirmed conviction
- UI remains functional if SoSoValue data is delayed or unavailable

## Phase 5 - Action Layer and Guardrails

### Goal

Connect research context to execution decisions without making the app reckless.

### Tasks

- define trade gating rules:
  - minimum technical confidence
  - minimum research confirmation
  - max risk regime handling
- add confirmation UI before execution
- optionally block execution when signal conflict is high
- log rationale used at execution time
- add audit-friendly trade metadata:
  - selected symbol
  - signal
  - catalyst summary
  - regime
  - confidence components

### Deliverables

- execution guardrail rules
- richer execution payload
- improved trade confirmation UX

### Acceptance Criteria

- a trade action references both model and research context
- high-risk contradictory setups are clearly flagged
- execution path remains understandable and reversible by the user

## Phase 6 - SoDEX Bonus Track

### Goal

Add SoDEX carefully, starting with low-risk read-only integration before any signed order flow.

### Stage A - Read Only

- fetch market metadata
- fetch tickers and orderbook data
- compare SoDEX market state against current signal
- display execution venue context in UI

### Stage B - Execution

- study auth and signing requirements
- isolate signer logic on the backend
- support dry-run validation first
- add paper execution mode before live mode
- add kill switch and hard limits

### Deliverables

- SoDEX read-only adapter
- optional paper execution router
- optional signed execution path

### Acceptance Criteria

- read-only integration does not destabilize the current product
- live execution is never enabled by accident
- signing flow is documented and testable

## Phase 7 - QA, Demo, and Buildathon Packaging

### Goal

Ship a polished, verifiable submission instead of a half-integrated prototype.

### Tasks

- create end-to-end test checklist
- record demo script
- capture screenshots and screen recordings
- document the SoSoValue flow clearly
- document fallback behavior
- document risks and future SoDEX path
- prepare final submission README section
- prepare architecture diagram

### Deliverables

- demo-ready app
- verification checklist
- Buildathon-ready documentation

### Acceptance Criteria

- a reviewer can understand the product in under 3 minutes
- the demo shows real SoSoValue-driven value, not only logo integration
- the repo explains setup, secrets, and the full user flow

## Workstreams

## Workstream A - Product and Use Case

Owner outcome:
- one clear primary use case, not many disconnected features

Tasks:
- define user persona
- define job-to-be-done
- define success metrics
- keep non-core ideas in backlog

## Workstream B - Backend Data Integration

Owner outcome:
- stable SoSoValue adapter with normalized data

Tasks:
- client wrapper
- caching
- retries
- schema normalization
- feature flagging

## Workstream C - Intelligence and Scoring

Owner outcome:
- explainable research score and signal fusion logic

Tasks:
- catalyst scoring
- regime classification
- contradiction detection
- rationale generation

## Workstream D - Frontend Experience

Owner outcome:
- dashboard and prediction pages that clearly communicate value

Tasks:
- layout integration
- loading and stale states
- rationale panel
- execution confirmation

## Workstream E - Quality and Submission

Owner outcome:
- reliable demo and clean docs

Tasks:
- smoke tests
- verification checklist
- README updates
- demo script

## Milestone Plan

| Milestone | Name | Outcome |
|---|---|---|
| M0 | Design Lock | clear MVP, endpoint list, env contract |
| M1 | API Foundation | backend client, cache, normalized responses |
| M2 | Research Layer | catalyst score and regime context |
| M3 | Fused Signal | SoSoValue-aware prediction output |
| M4 | UX Release | dashboard and AI page integration |
| M5 | Guarded Action | context-aware execution flow |
| M6 | Bonus | SoDEX read-only or execution prototype |
| M7 | Submission | demo package and docs complete |

## Definition of Done

The SoSoValue integration is considered done for MVP when all of the following are true:

- the backend uses real SoSoValue API data
- the dashboard shows SoSoValue-powered context for supported assets
- the signal payload includes research-aware reasoning
- the execution path references research context and guardrails
- fallback behavior is clear when SoSoValue is unavailable
- setup and demo documentation are complete

## Risks and Mitigations

### Risk 1 - Access or quota issues

Mitigation:
- build behind feature flags
- cache aggressively
- support graceful fallback

### Risk 2 - Over-scoping

Mitigation:
- ship SoSoValue research integration before SoDEX execution
- keep one primary use case

### Risk 3 - Low explainability

Mitigation:
- every score must include a rationale field
- avoid black-box composite values without explanation

### Risk 4 - UI overload

Mitigation:
- show summary first
- tuck details into expandable panels

### Risk 5 - Trading risk from research noise

Mitigation:
- use research as confirmation or caution input
- do not allow research alone to force execution

## Decision Log Rules

Every important integration decision should be written down in a short note with:

- date
- decision
- reason
- impact
- follow-up

Recommended file:
- `SOSOVALUE_INTEGRATION_NOTES.md`

## Suggested Task Order for This Repo

1. Add backend SoSoValue client and env wiring.
2. Add currency mapping and research context endpoints.
3. Add catalyst and regime scoring.
4. Extend enhanced predictor with SoSoValue-aware fusion.
5. Update dashboard response shape.
6. Add frontend research panels.
7. Add execution guardrails based on fused signal.
8. Prepare demo and docs.

## First Sprint Checklist

- [ ] confirm Buildathon access and usable API key
- [ ] define supported MVP symbols
- [ ] add `SOSO_API_KEY` to backend env
- [ ] create `comprehensive_backend/sosovalue_api.py`
- [ ] fetch and cache listed currencies
- [ ] fetch and normalize featured news by currency
- [ ] add `/api/sosovalue/research-context/{symbol}`
- [ ] add response examples for BTC and ETH
- [ ] document fallback behavior

## Discipline Rules for Execution

- no new feature starts before the current milestone has acceptance proof
- no direct UI dependence on unstable endpoint shapes
- no live execution work before read-only and paper flow are stable
- no undocumented derived score is allowed into the UI
- no secret leaves the backend

## Immediate Next Step

Start Phase 0 and Phase 1 together:
- finalize the MVP use case
- implement the backend SoSoValue adapter
- return normalized research context for one asset first, preferably BTC
