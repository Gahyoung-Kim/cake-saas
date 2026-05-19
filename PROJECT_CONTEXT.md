# PROJECT_CONTEXT.md

# Cake SaaS MVP

## Project Overview

This project is a mobile-first SaaS MVP for custom cake shop owners in Korea.

The goal is NOT to build a generic admin dashboard.

The real goal is:

* Reduce operational stress
* Prevent missed reservations
* Simplify DM/chat-based order management
* Convert messy conversations into structured reservation workflows
* Help 1-person shop owners manage production schedules more safely

This project is based on real custom cake shop workflow experience.

---

# Core Workflow

The core product loop is:

Chat / DM text
→ AI extraction
→ Reservation draft
→ User correction
→ Reservation save
→ Calendar / production workflow

The AI extraction workflow is the core differentiator.

---

# Target Users

Primary users:

* Korean custom cake shop owners
* 1-person dessert shops
* Small handmade order-based businesses

Future expansion MAY include:

* flower shops
* handmade craft shops
* lunchbox/dosirak services
* custom production businesses

BUT:

Current MVP focus is ONLY custom cake shops.

Do NOT over-generalize the product yet.

---

# Current MVP Priorities

Highest priorities:

1. AI extraction accuracy
2. Fast reservation creation
3. Mobile usability
4. Calendar workflow clarity
5. Reducing reservation mistakes

The product should feel:

* fast
* practical
* low-stress
* mobile-friendly

---

# Important Real-World Context

Korean order conversations are messy and inconsistent.

The system must handle:

* relative dates
* ambiguous pickup times
* Korean payment expressions
* lettering requests
* cake sizes
* custom design requests

Examples:

* "이번주 토요일"
* "픽업은 3시쯤"
* "입금은 저녁에 할게요"
* "레터링은 생일축하해 민지야"
* "2호 도시락 케이크"

Extraction does NOT need to be perfect.

The goal is:

* reduce manual work
* reduce mistakes
* make correction fast

---

# Current Tech Stack

## Frontend

* React 19
* TypeScript
* Vite
* Zustand
* TanStack Query
* TailwindCSS

## Backend

* FastAPI
* SQLAlchemy
* Alembic
* MySQL

## AI

* Claude API

---

# Architectural Philosophy

Avoid:

* premature optimization
* enterprise overengineering
* unnecessary abstraction
* excessive microservices
* generic platformization

Prefer:

* practical workflows
* simple architecture
* readable code
* fast MVP iteration
* rapid real-world testing

---

# UI / UX Philosophy

This product is used by busy shop owners on mobile devices.

UX priorities:

* quick actions
* low cognitive load
* clear reservation states
* large touch areas
* simple flows

The UI should feel:

* warm
* calm
* emotionally friendly
* operationally efficient

NOT:

* corporate
* cold enterprise dashboard

---

# Important Development Rules

Before large refactors:

* understand workflow intent first
* preserve MVP speed
* preserve mobile usability

Do NOT aggressively refactor architecture early.

Focus on:

* working product
* user testing
* real workflow validation

---

# Current Most Important Goal

Validate this:

Can this product significantly reduce reservation management stress for custom cake shop owners?

That is the primary success metric right now.
