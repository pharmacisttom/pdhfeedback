# CHANGELOG - PdhFeedback

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-10-04

### Added
- **SaaS Packages & Pricing Engine**:
  - Seeded 5 standard tiers: `Free` (฿0), `Starter` (฿299/mo or ฿2,990/yr), `Professional` (฿799/mo or ฿7,990/yr), `Business` (฿1,990/mo or ฿19,900/yr), and `Enterprise` (Custom quote).
  - All monetary calculations strictly performed on the server using integer satang (`priceSatang`, `amountSatang`, `netAmountSatang`) to prevent floating-point calculation errors.
  - Price snapshot preservation: orders preserve `planCodeSnapshot`, `planNameSnapshot`, and `amountSatang` at the moment of order creation.
  - Public Pricing page (`/pricing`) with interactive Monthly/Annual billing switcher, ~17% annual discount banner (2 months free), quota meters, feature matrix, and FAQ.
- **Subscriptions & Quota Lifecycle**:
  - Support for `ACTIVE`, `PENDING_PAYMENT`, `UNDER_REVIEW`, `PAST_DUE`, `CANCELED`, and `EXPIRED` subscription states.
  - Monthly response quota resets based on the organization's subscription anchor day (`anchorDay`) even for annual subscriptions.
  - Leap year and end-of-month clamping algorithm (Feb 28/29, Apr 30, etc.) with comprehensive unit test coverage.
  - Quota enforcement in `/api/surveys/submit` preventing responses beyond monthly allocation.
- **Manual Bank Transfer & PromptPay QR Billing**:
  - Platform bank transfer instructions with configurable account number, bank name, and account holder.
  - EMVCo standard PromptPay QR Code generator (`generatePromptPayPayload`) with AID `A000000677010111`, CRC16-CCITT checksum, and dynamic QR support with exact satang amount.
  - Payment slip upload with private server-side storage in `storage/evidence/`, file signature and MIME type verification (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), and 5MB limit.
  - Private authorized download endpoint (`/api/billing/evidence/[evidenceId]`) restricted to tenant owners/admins and platform billing admins.
  - Platform Admin review and approval endpoint (`/api/billing/review`) with atomic transaction updating subscription period, status, and generating electronic receipt documents.
  - Printable official payment confirmation receipt (`/api/billing/receipt/[orderId]`) with document numbers, organization details, tax ID, and browser print styles.
- **Server-Side Feature Entitlements**:
  - Central feature catalogue (`src/lib/entitlements.ts`) and plan-feature matrix.
  - Server-side feature checks guarding XLSX exports (`/api/export`), custom questions, conditional logic, and branding.
  - Dynamic "Powered by Tomvis" footer visibility based on the `hide_powered_by` entitlement (hidden on Business & Enterprise, visible on Free/Starter/Pro).
- **Consoles & Testing**:
  - Organization Plan & Usage console (`/[orgSlug]/plan`) with live quota meters, renewal dates, order modal, slip upload preview, and receipt downloads.
  - Platform Billing console (`/platform/billing`) with Cash collected, MRR, ARR, and pending payment review queue.
  - Extended Vitest suite with 27 unit & integration tests covering satang arithmetic, leap years, PromptPay standard, and tenant isolation.

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
