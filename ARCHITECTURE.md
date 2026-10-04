# PdhFeedback - System Architecture & Implementation Plan

> **ข้อความหลักของผลิตภัณฑ์:** "รับฟังทุกบริการ เห็นผลชัด ปรับปรุงได้ทันที"  
> **วัตถุประสงค์:** ระบบประเมินความพึงพอใจในการรับบริการแบบ Multi-tenant SaaS สำหรับโรงพยาบาล, คลินิก, สหกรณ์, ร้านค้า และธุรกิจบริการ

---

## 1. System Architecture Overview

```
                      +---------------------------------------+
                      |          Clients / Browsers           |
                      |   - Mobile Survey (Single-hand UX)   |
                      |   - Org Admin & Staff Console         |
                      |   - Platform Super Admin Console      |
                      +-------------------+-------------------+
                                          |
                                    HTTPS / WSS
                                          |
                                          v
                      +---------------------------------------+
                      |         Nginx Reverse Proxy           |
                      |   (SSL, Security Headers, Gzip)       |
                      +-------------------+-------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| Next.js App Router (Full-Stack TypeScript Strict)                                 |
|                                                                                   |
|  +--------------------+  +-----------------------+  +--------------------------+  |
|  |    Public Layer    |  |     Tenant Console    |  |      Platform Admin      |  |
|  |  - /s/[code]       |  |  - /[orgSlug]/...     |  |  - /platform/...         |  |
|  |  - /login, register|  |    Dashboard, Surveys,|  |    Orgs, Quotas, Plans,  |  |
|  |  - /onboarding     |  |    Responses, Cases   |  |    Audit logs, System    |  |
|  +---------+----------+  +-----------+-----------+  +------------+-------------+  |
|            |                         |                           |                |
|            v                         v                           v                |
|  +-----------------------------------------------------------------------------+  |
|  | Business Services & Authorization Engine                                     |  |
|  |  - Multi-tenant Scoping (organizationId enforcement on all queries)         |  |
|  |  - RBAC Matrix (Owner, Admin, Service Manager, Analyst/Viewer, Respondent)  |  |
|  |  - Survey Versioning & Immutable History (Draft -> Published -> Closed)     |  |
|  |  - Metrics Calculation (CSAT, NPS, Averages, Prior Period Comparisons)      |  |
|  |  - Feedback Lifecycle (New -> Ack -> In Progress -> Resolved -> Closed)     |  |
|  |  - Export Engine (Anti-Formula Injection, UTF-8 BOM Thai handling)          |  |
|  |  - Rate Limiter, Honeypot & Idempotency Key Processor                       |  |
|  +-----------------------------------------------------------------------------+  |
|                                      |                                            |
|                                      v                                            |
|  +-----------------------------------------------------------------------------+  |
|  | Prisma ORM 5.x Data Access Layer (Strict Types, Parameterized Queries)     |  |
|  +-----------------------------------------------------------------------------+  |
+--------------------------------------|--------------------------------------------+
                                       |
                                       v
                      +---------------------------------------+
                      |           MySQL 8 Database            |
                      |  (utf8mb4, Indexes on tenant + date)  |
                      +---------------------------------------+
```

---

## 2. Multi-tenant Isolation & Security Architecture

1. **Tenant Identification & Authorization**:
   - Every tenant-scoped entity (`Branch`, `ServicePoint`, `Survey`, `Response`, `FeedbackCase`, `Notification`, `AuditLog`, etc.) has a non-nullable `organizationId` foreign key.
   - Client-provided `organizationId` is never trusted. The server verifies user session membership and matches the URL context.
   - Public Survey resolution is performed via a permanent public token (`publicCode` / cuid) mapped strictly on the server to `(organizationId, surveyId, servicePointId)`.

2. **Role-Based Access Control (RBAC) Matrix**:
   - **Platform Super Admin**: Platform oversight, organization management, plan quotas, global audit log (no automated private answer reading).
   - **Organization Owner**: Full org admin, member invitations, role updates, ownership transfer, quota & billing settings. (Cannot delete last owner).
   - **Organization Admin**: Manages branches, service points, surveys, versions, team members.
   - **Service Manager**: Scoped to assigned service points; views and resolves feedback cases for their units.
   - **Analyst/Viewer**: Read-only dashboard and reports. Contact details and exports are guarded by explicit permissions.
   - **Respondent**: Public mobile/desktop respondent. No login required. Anti-tampering idempotency tokens.

3. **Survey Versioning & Immutability**:
   - Once a survey version is published and receives responses, its structure (questions, options, scales) becomes strictly immutable.
   - Subsequent modifications automatically branch into a new version (e.g. `v2`).
   - Every submitted `Response` and `ResponseAnswer` references the exact `surveyVersionId` used at submission time, guaranteeing historical data integrity.

4. **Metrics Formulation**:
   - **CSAT (Customer Satisfaction Score)**:
     $$\text{CSAT} = \frac{\text{Count of responses rating } 4 \text{ or } 5}{\text{Total valid responses for target overall/CSAT question}} \times 100$$
   - **NPS (Net Promoter Score)**:
     $$\text{NPS} = \% \text{Promoters (9-10)} - \% \text{Detractors (0-6)}$$ (Scale 0–10)
   - **Average Score**: Calculated exclusively on completed ratings (unanswered optional questions do not count as 0).
   - **Weighted Aggregate**: Multi-topic composite scores only calculated when explicit weights are configured.

5. **Security & Privacy Guardrails**:
   - Anti-Formula Injection: Leading `=, +, -, @` sanitized in CSV/Excel export.
   - Contact Isolation: Contact details (name, telephone) stored in separate `ResponseContact` table, masked or gated by permission.
   - Sensitive Data Warnings: Thai prompt explicitly displayed: *"กรุณาไม่ระบุเลขบัตรประชาชน ข้อมูลสุขภาพ หรือข้อมูลส่วนบุคคลของผู้อื่น"*.
   - Idempotency: `idempotencyKey` prevents duplicate submits on network retry.

---

## 3. Development Phases

- **Phase 0: Architecture & Environment Setup** (Database initialization, package configuration, strict tsconfig, Tailwind design tokens)
- **Phase 1: Database Schema, Prisma ORM, Auth & RBAC** (Multi-tenant tables, password hashing, HttpOnly session, tenant switching)
- **Phase 2: Service Points, Branches & Survey Builder** (Survey types: Rating 1-5, NPS 0-10, Choices, Text, Yes/No, Versioning, Draft/Publish)
- **Phase 3: Public Mobile Survey Experience & QR Engine** (Single-hand mobile UI, QR generation, Service Point display sign, Idempotency)
- **Phase 4: Responsive Analytics Dashboard & Export Engine** (CSAT, NPS, Trends, Date filters, Comparison period, CSV/Excel/PDF)
- **Phase 5: Feedback Case Workflow & Notifications** (New -> In Progress -> Resolved, Assignees, Low score alerts)
- **Phase 6: Platform Super Admin & Organization Settings** (Plan quotas, branding, audit logs)
- **Phase 7: Developer API & Background Job Architecture** (V1 API, webhook triggers, token authentication)
- **Phase 8: Comprehensive Testing, Deployment Configuration & Deliverables** (Vitest unit/integration tests, Docker Compose, Nginx, VPS guide, screenshots)
- **Phase 9: SaaS Packages, Monthly/Annual Subscriptions, Billing & Feature Entitlements** (Free, Starter, Professional, Business, Enterprise, integer satang price snapshots, EMVCo PromptPay QR, bank transfer with private slip verification, platform billing review console, atomic activations, printable electronic receipts, monthly anchor-reset response quota, and server-side feature gating)
- **Phase 10: Safe Billing Activation Mode & Administrative Access Grants** (Production default `BILLING_MODE=disabled`, monetization decoupling, strict 403 API guards on orders/slips, Administrative Access Grants for non-monetized tier overrides, sandbox test isolation, readiness checklists, and activation guide `BILLING_ACTIVATION_GUIDE.md`)

*พัฒนาต่อจนจบ และสร้างแพ็คเก็จ สำหรับใช้งานในฟีเจอร์ที่เยอะขึ้นและ ระบบที่มากกว่าเดิม*
