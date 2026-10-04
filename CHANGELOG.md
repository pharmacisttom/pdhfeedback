# CHANGELOG - PdhFeedback

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-10-04

### Added
- **Core SaaS & Multi-tenant Architecture**:
  - Full-stack Next.js App Router (14.2) with strict TypeScript.
  - Multi-tenant isolation engine strictly scoped by `organizationId` foreign keys and server-side checks.
  - Organization Switcher for seamless multi-org access.
- **Authentication & RBAC**:
  - Secure HttpOnly session cookies with JWT (`jose`) and bcrypt password hashing.
  - Full Permission Matrix covering 5 roles: `Platform Super Admin`, `Organization Owner`, `Organization Admin`, `Service Manager` (scoped to assigned service points), and `Analyst/Viewer`.
  - Transfer of ownership safeguards preventing removal of the last owner.
- **Service Points & QR Generator**:
  - Branch and Service Point management with code, description, and ordering.
  - Stable permanent `publicCode` for QR resilience across slug changes.
  - Printable Counter Display Stand view (`/s/[code]/qr`) with SVG rendering and high-res PNG download.
- **Survey Builder & Versioning**:
  - Support for Rating 1-5 (stars and smileys), NPS 0-10, Yes/No, Single/Multi choices, and Short/Long text.
  - Immutability guarantee: published surveys with existing responses cannot be structurally altered; changes create a new version (`v2`, `v3`).
  - Pre-built industry survey templates for Hospital OPD, Pharmacy, Cooperative/Finance, Retail/Service, and Training.
- **Mobile-First Public Survey (`/s/[code]`)**:
  - Single-hand friendly mobile interface with 44px+ touch targets and completion progress bar.
  - Client & Server idempotency protection (`idempotencyKey`) preventing double submissions on retry.
  - Honeypot anti-spam bot trap and salted IP hashing rate limiter.
  - Segregated callback contact collection (consent-separated, off by default).
  - Celebration confetti and Kiosk mode auto-reset countdown timer.
- **Responsive Analytics Dashboard**:
  - True database-backed real-time metrics for Total Responses, CSAT %, Average Score, and NPS.
  - Rating distribution charts and daily response trends with accessibility table fallback.
  - Question topic analysis sorted by lowest ratings for fast targeted improvements.
  - Period comparison vs previous equal duration with zero-denominator handling.
  - Thai Buddhist Era (พ.ศ.) date formatting and Asia/Bangkok (+07:00) timezone boundaries.
- **Feedback Case Workflow**:
  - Complete lifecycle: `New` -> `Acknowledged` -> `In Progress` -> `Resolved` -> `Closed`.
  - Root cause and corrective action tracking, urgency levels, assignees, and internal notes history.
  - Automatic low rating alert cases and notifications for scores <= 2.
- **Safe Export & Reports**:
  - CSV export with UTF-8 BOM for Microsoft Excel Thai language compatibility.
  - Anti-formula injection protection sanitizing leading `=`, `+`, `-`, `@`.
  - Contact privacy segregation ensuring contact data is excluded from general exports.
- **DevOps, Security & Deployment**:
  - Multi-stage `Dockerfile` with non-root user `nextjs` and automated `/api/health` check.
  - `docker-compose.yml` with MySQL 8 healthchecks, persistent volumes, and non-public db ports.
  - `nginx.conf` sample configuration with SSL, rate limiting, and security headers.
  - `scripts/backup.sh` and `scripts/restore.sh` with automated 30-day retention.
  - Vitest unit tests (9 tests) and multi-tenant integration tests (3 tests) passing 100%.
