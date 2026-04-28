# TravelMate Admin Dashboard Implementation Plan

## 1. Admin App Features (Copied Baseline)

### 1.1 Admin Authentication and Access Control
- Admin login/logout
- Role-based admin permissions (super admin, operations, reviewer, support, finance)
- MFA/2FA for admin accounts
- Session and device management
- Admin password reset

### 1.2 Admin Dashboard and Operations Overview
- Platform summary cards:
  - Total partners
  - Verified partners
  - Total stays/transfers
  - Pending approvals
  - API clients and usage snapshot
- Queue widgets (pending KYC, pending listing moderation)
- Recent platform activity stream
- Operational alerts and risk flags

### 1.3 Partner Verification and Lifecycle Management
- View partner applications
- Review KYC/KYB documents
- Approve/reject/suspend partner accounts
- Add review notes/internal comments
- Request additional documents
- Track re-submissions and verification history
- Partner status lifecycle control (pending, verified, rejected, suspended)

### 1.4 Partner Account Management
- Search/filter partners by status, location, join date
- View full partner profile and listing portfolio
- Edit limited partner metadata (where policy allows)
- Lock/unlock partner access
- Soft-delete/restore partner accounts

### 1.5 Listing Moderation (Stays and Transfers)
- Moderation queue for newly submitted listings
- Review listing content, media, and compliance
- Approve/reject/send-back-for-edits
- Add moderation reasons and required fixes
- Bulk approve/reject actions (with caution controls)
- Flagged listing management
- Emergency unpublish/takedown control

### 1.6 Catalog and Content Quality Controls
- Enforce mandatory data standards
- Detect duplicate/suspicious listings
- Geo-data validation checks
- Content policy enforcement (fraud/spam/inappropriate content)
- Standardize taxonomy (amenities, property types, vehicle classes)

### 1.7 Business API Client Management
- View incoming API access applications
- Approve/reject API clients
- Generate/revoke/regenerate API keys
- Assign usage plans and rate limits
- Monitor per-client usage and quota consumption
- Block abusive API clients

### 1.8 API Governance and Monitoring
- Endpoint-level traffic analytics
- Error rate and latency monitoring
- Rate-limit violation logs
- API key activity history
- Access logs and auditability for sensitive endpoints

### 1.9 Pricing, Commission, and Commercial Controls (Optional/Configurable)
- Configure default pricing policy rules
- Configure partner commission settings (if marketplace model is active)
- Set service fees or markups (if applicable)
- Manual financial adjustments with audit trail

### 1.10 Notifications and Messaging (Admin Side)
- Send system notifications to partners
- Trigger transactional emails (approval/rejection/info requests)
- Broadcast announcements to selected partner segments

### 1.11 Reporting and Analytics
- Partner growth and verification funnel reports
- Listing funnel reports (draft to live conversion)
- Stay vs transfer supply reports by region
- API adoption and usage reports
- Export reports (CSV)

### 1.12 Audit, Compliance, and Security
- Full audit log for admin and partner critical actions
- Admin action traceability (who changed what, when)
- Data retention policy controls
- Access control policy management
- Compliance support exports (for legal/internal review)

### 1.13 System Configuration and Master Data
- Manage supported countries/cities and service areas
- Manage platform taxonomies (amenities, vehicle categories, tags)
- Manage status definitions and moderation templates
- Feature toggles for controlled rollouts
- Manage static content (terms, policy pages, help docs)

### 1.14 Support and Incident Tools
- Partner issue tracking panel
- Internal notes and escalation workflow
- Incident flagging and response log
- Admin troubleshooting utilities (safe diagnostics)

### 1.15 Financial Operations and Settlement Management
- Platform wallet/ledger controls for partner earnings
- Configure booking-completion settlement rules and risk windows
- Settlement processing dashboard by completed bookings
- Settlement run status tracking (`queued`, `processing`, `completed`, `partial`, `failed`) for admin-operated batch/reconciliation workflows
- Settlement failure handling and retry tools
- View settlement history by partner, region, and date
- Commission and fee rule management tied to settlement events
- Generate partner settlement statements and financial exports
- Reconciliation tools (bookings vs earnings vs settlements)
- Refund/chargeback impact handling on partner balances
- Admin-triggered cancellation refund workflow:
  - Notify partner to refund
  - Track partner acknowledgment and refund completion status
  - Escalate unresolved refunds for operations follow-up
- Financial audit logs for all settlement and refund actions

### 1.16 Settlement Account (Payout Method) Review and Security Controls
- Admin review queue for newly submitted settlement account details
- Approve/reject settlement account details with reason codes
- View settlement account verification status per partner
- Trigger re-verification for suspicious account changes
- Restricted access to sensitive settlement account data by admin role
- Masked settlement account data view for non-finance roles
- Full audit log for settlement account detail submissions and approvals
- Fraud/risk flags for rapid account changes or mismatch patterns
- Manual settlement hold toggle when settlement account verification is incomplete

### 1.17 Admin User Management and Access Governance
- Admin directory for internal admin accounts
- Invite new admins by email
- Resend or revoke pending admin invites
- Activate/deactivate admin accounts
- Assign and change admin roles (`super_admin`, `operations`, `reviewer`, `support`, `finance`)
- Review MFA state, recent session activity, and last sign-in
- Permission policy visibility for protected surfaces and privileged actions
- Audit log for admin invites, role changes, deactivation/reactivation, and access-policy updates
- Optional approval controls for sensitive role grants (`super_admin`, `finance`)

## 2. Feature Flows (Admin App)

### 2.0 Admin Shell and Platform Foundation Flow
- Admin opens the back-office application shell.
- System loads the global admin layout, navigation, search entry, role/session controls, notifications entry, and responsive dashboard frame.
- Admin can access scaffolded module routes and shared operational UI primitives from a consistent shell.
- Shell establishes reusable patterns for KPI cards, queue widgets, tables, filters, drawers, timelines, empty states, and alerts that later flows plug into.

### 2.1 Admin Authentication and Access Control Flow
- Admin opens sign in.
- Admin submits credentials and completes MFA/2FA where required.
- System validates role permissions and creates a trusted admin session.
- Admin can review active sessions, logout, and reset password when needed.

### 2.2 Admin Dashboard and Operations Overview Flow
- Signed-in admin lands on the operations dashboard.
- System loads platform summary metrics, queue counts, recent activity, and risk alerts.
- Admin drills into pending queues or operational hotspots from dashboard widgets.

### 2.3 Partner Verification and Lifecycle Management Flow
- Admin opens partner verification queue.
- System shows submitted partner applications and supporting KYC/KYB documents.
- Admin previews/downloads private supporting documents, adds internal notes, and approves/rejects/suspends partners.
- Verification evidence is expected to come from private S3-compatible storage in production, mediated through protected admin endpoints.
- System records verification history and notifies the partner of the decision or document request.

### 2.4 Partner Account Management Flow
- Admin searches or filters partners.
- System returns partner records with lifecycle state and portfolio context.
- Admin reviews account details, applies permitted metadata changes, and locks/unlocks or restores accounts when policy allows.

### 2.5 Listing Moderation (Stays and Transfers) Flow
- Admin opens the moderation queue for submitted stays/transfers.
- System loads listing details, media, compliance context, and moderation history.
- Listing media is expected to be served from Cloudinary-backed public/media delivery workflows in production.
- Admin approves, rejects, sends back for edits, flags, bulk-updates, or emergency-unpublishes listings.
- System stores moderation reasons and notifies the partner.

### 2.6 Catalog and Content Quality Controls Flow
- Admin reviews catalog quality dashboards and flagged inventory.
- System runs duplicate, taxonomy, geo-data, and policy checks.
- Admin standardizes content, updates taxonomy rules, and resolves suspicious listings.

### 2.7 Business API Client Management Flow
- Admin reviews API access applications.
- System shows applicant details, plan eligibility, usage, and risk indicators.
- Admin approves/rejects clients, issues or revokes API keys, and adjusts rate limits or plans.

### 2.8 API Governance and Monitoring Flow
- Admin opens API monitoring surfaces.
- System shows traffic, latency, errors, rate-limit violations, and access history.
- Admin investigates anomalies and takes governance actions on abusive or failing clients.

### 2.9 Pricing, Commission, and Commercial Controls Flow
- Admin reviews marketplace pricing and commission configuration.
- System loads current fee rules, partner commercial settings, and manual adjustment history.
- Admin updates commission or service fee rules with audit logging.

### 2.10 Notifications and Messaging Flow
- Admin composes a partner-facing notification, transactional trigger, or announcement.
- System validates target segments and channels.
- Message is sent to selected partners with logging and delivery metadata.

### 2.11 Reporting and Analytics Flow
- Admin opens analytics and reporting.
- System aggregates partner growth, verification funnels, listing conversion, supply mix, and API adoption.
- Admin filters by region/timeframe and exports reports.

### 2.12 Audit, Compliance, and Security Flow
- Admin opens audit or compliance surfaces.
- System exposes critical action traces, retention controls, access policy context, and exportable compliance records.
- Admin investigates events and exports evidence for internal/legal review.

### 2.13 System Configuration and Master Data Flow
- Admin manages countries, cities, service areas, taxonomies, moderation templates, and feature toggles.
- System validates configuration dependencies before publishing updates.
- Updated master data becomes available to partner and admin workflows.

### 2.14 Support and Incident Tools Flow
- Admin reviews incoming partner issues and flagged incidents.
- System shows issue history, internal notes, escalation state, and diagnostics.
- Admin records actions, escalates when needed, and resolves issues with traceability.
- Listing suspension appeals (`paused_by_admin` listings where the partner has submitted an appeal) appear in the support/incident queue as a distinct appeal case type.
- Admin opens an appeal case to see: listing name and kind, partner name, suspension moderation feedback reason, appeal message, and date submitted.
- Admin resolves the appeal with a reinstate or dismiss decision and an optional resolution note.
- Reinstate: triggers listing `approve` transition; listing becomes `approved` and partner is notified.
- Dismiss: listing remains `paused_by_admin`; partner receives a dismissal notification with the resolution note.
- Appeal queue requires `operations` role minimum for resolve actions; `viewer` role may read the queue.

### 2.15 Financial Operations and Settlement Management Flow
- Admin opens financial operations for partner settlements.
- System loads booking-completion settlements, balances, refunds, reconciliation status, and failure queues.
- Admin configures settlement rules, reviews run status, retries failures, triggers refund follow-up, and exports statements or reconciliations.
- System records all settlement and refund actions in financial audit logs.

### 2.16 Settlement Account (Payout Method) Review and Security Controls Flow
- Admin opens settlement account review queue.
- System shows submitted payout methods, verification status, fraud/risk flags, and masked sensitive details by role.
- Admin approves/rejects payout methods, triggers re-verification, or places manual settlement holds when verification is incomplete.
- System records decision history and enforces role-restricted visibility of sensitive data.

### 2.17 Admin User Management and Access Governance Flow
- Super admin opens admin access management.
- System shows internal admin accounts, pending invites, assigned roles, MFA state, recent session signals, and access-policy context.
- Super admin invites admins, changes roles, deactivates/reactivates access, or resends/revokes pending invites according to policy.
- System records all admin-access changes in audit logs and enforces approval or confirmation requirements for sensitive role grants where configured.

## 3. Admin/Partner Alignment Notes

- The `admin_dashboard` is the back office for the completed `partner_app`; it should manage and supervise partner-originated states rather than recreate partner-facing flows.
- Partner app responsibilities already completed and now supervised by admin workflows include:
  - partner onboarding and verification submission
  - stay and transfer submission/moderation lifecycle
  - pricing/availability data quality signals
  - partner notifications and reporting surfaces
  - booking-completion settlements, refund tracking, and payout-method submission
- Planned partner-onboarding redesign should stay visible in admin workflows:
  - partner operating coverage is now implemented in `api` and `partner_app` as structured country/region/city selections with optional coverage notes
  - payout setup is now implemented in `api` and `partner_app` as payout method, settlement currency, and disbursement cadence
  - the remaining admin-dashboard work is to expose that structured coverage and payout setup clearly in partner review/detail surfaces
  - admin copy should state that service completion creates settlement eligibility, while cadence only controls when available balances are disbursed

## 4. Current Implementation Alignment

- `api` and `partner_app` are now aligned for the Phase 2 partner-onboarding operations redesign.
- `admin_dashboard` must now mirror the same contract in partner supervision surfaces:
  - operating countries
  - operating regions
  - operating cities
  - optional coverage notes
  - payout method
  - settlement currency
  - disbursement cadence
  - explicit settlement trigger messaging tied to service completion
- Until this admin visibility lands, the slice is only partially aligned across the three product surfaces.
- Admin workflow status models must align with partner-facing models already established in `partner_app/AGENTS.md` and `partner_app/plan.md`, especially:
  - Verification: `pending`, `in_review`, `approved`, `rejected`
  - Verification-to-lifecycle mapping: verification `approved` promotes partner lifecycle to `verified`; verification `rejected` promotes partner lifecycle to `rejected`; `suspended` is an admin lifecycle control, not a verification outcome
  - Listing: `draft`, `pending`, `approved`, `live`, `paused`, `paused_by_admin`, `rejected`, `archived`
    - `paused_by_admin` is set by admin emergency unpublish; the partner has no self-service actions on this state; admin can reinstate (`approve`) or archive; partner UI shows "Suspended by platform" with moderation reason
  - Partner-facing settlement status: `pending_completion`, `processing`, `paid`, `failed`, `reversed`
  - Admin settlement run status: `queued`, `processing`, `completed`, `partial`, `failed`
  - Refund: `requested`, `partner_notified`, `refunded`, `disputed`, `recovered`
- Admin settlement account review in Flow 2.16 is the back-office counterpart to partner payout-method submission and verification in partner Flow 2.15.
- Admin partner-review and finance surfaces should reflect the same settlement semantics:
  - stays become settlement-eligible after checkout
  - transfers become settlement-eligible after trip completion
  - daily/weekly/manual cadence affects disbursement timing only, not earning creation
- Admin listing moderation in Flow 2.5 is the back-office counterpart to partner listing submission and correction workflows in partner Flows 2.5, 2.7, 2.9, and 2.10.
- Admin listing suspension appeal resolution in Flow 2.14 is the back-office counterpart to partner listing suspension appeal submission in partner Flow 2.16.
- Admin financial operations in Flow 2.15 is the back-office counterpart to partner wallet and settlement visibility in partner Flows 2.14 and 2.15.
- Admin route and module naming should follow the current admin scaffold where applicable:
  - route slugs currently use `/partners` for partner operations and `/moderation` for listing moderation
  - feature/module names may remain `partner-operations` and `listing-moderation` internally as long as route labels and docs stay explicit

## 4. Project Status

- Flow 2.0 Admin Shell and Platform Foundation: `Completed`
- Flow 2.1 Admin Authentication and Access Control: `Completed`
- Flow 2.2 Admin Dashboard and Operations Overview: `Completed`
- Flow 2.3 Partner Verification and Lifecycle Management: `Completed`
- Flow 2.4 Partner Account Management: `Completed`
- Flow 2.5 Listing Moderation (Stays and Transfers): `Completed`
- Flow 2.6 Catalog and Content Quality Controls: `Completed`
- Flow 2.7 Business API Client Management: `Completed`
- Flow 2.8 API Governance and Monitoring: `Completed`
- Flow 2.9 Pricing, Commission, and Commercial Controls: `Completed`
- Flow 2.10 Notifications and Messaging: `Completed`
- Flow 2.11 Reporting and Analytics: `Completed`
- Flow 2.12 Audit, Compliance, and Security: `Completed`
- Flow 2.13 System Configuration and Master Data: `Completed`
- Flow 2.14 Support and Incident Tools: `Completed`
- Flow 2.15 Financial Operations and Settlement Management: `Completed`
- Flow 2.16 Settlement Account (Payout Method) Review and Security Controls: `Not started`
- Flow 2.17 Admin User Management and Access Governance: `In progress` (frontend workspace complete with mock data; backend API and real wiring pending — Phase 2.5 in api/plan.md)

Current planning note:
- This file initializes the admin application scope using the baseline from `app_features.md`, with explicit alignment to the completed partner app so the admin dashboard can act as the back office without conflicting ownership.
- Initial build direction is to start with Flow `2.0` as a polished admin shell first: navigation, top bar, dashboard frame, route scaffolds, KPI/queue surfaces, and reusable admin layout primitives before deeper flow-by-flow implementation.
- Flow `2.0` is now completed with the admin app foundation, polished shell, route scaffolds, shared operational primitives, and passing unit/build/E2E validation in place.
- Flow `2.1` is now completed with signed trusted-session handling, role-based middleware protection, MFA challenge flow, reset-password route, session/device management UI, and passing unit/build/E2E validation in place.
- Flow `2.2` is now completed with role-aware dashboard metrics, operational queue widgets, alerts, activity feed, and route drill-down links aligned to back-office ownership.
- Flow `2.3` is now completed with a verification review workspace, connected case detail surfaces, state-aware approve/reject/request-more-info/suspend actions, case-owned audit/notification prep metadata, review history, and partner-app-aligned verification-to-lifecycle outcomes.
- Flow `2.4` is now completed with a searchable partner directory, account detail surface, metadata editing, lock/unlock/restore lifecycle controls, URL-synced filter state, role-based policy guards, and passing unit/integration/E2E validation in place.
- Flow `2.5` is now completed with stay and transfer moderation queues, listing detail review surfaces, approve/reject/send-back/flag/emergency-unpublish actions, moderation reason capture, bulk-action support, and partner-app-aligned listing lifecycle semantics.
- Flow `2.6` is now completed with a catalog quality control workspace, flagged-listing and taxonomy-issue queues, duplicate/geo/policy flag resolution, taxonomy-rule management, and content standardization controls.
- Flow `2.7` is now completed with an API client review queue, key generation/revocation/regeneration, plan and rate-limit assignment, client blocking controls, and usage/quota visibility.
- Flow `2.8` is now completed with API traffic, latency, and error-rate monitoring surfaces, rate-limit violation logs, per-client access history, and governance actions for abusive or failing clients.
- Flow `2.9` is now completed with commission and service-fee rule management, manual financial adjustment workflow, and a full audit trail for all commercial-control changes.
- Flow `2.10` is now completed with a partner-messaging composer, direct/transactional/broadcast channel support, audience targeting, delivery metadata, and message-audit records.
- Flow `2.11` is now completed with partner-growth, verification-funnel, listing-conversion, regional-supply, and API-adoption reporting dashboards and CSV export support.
- Flow `2.13` is now completed with a taxonomy and feature-toggle configuration workspace, role-gated publish/deprecate/toggle actions (super_admin full access, operations toggle-only), URL-synced filters, operator note validation, and full test coverage.
- Flow `2.12` is now completed with a role-filtered audit log explorer, compliance evidence export, retention-config visibility (super_admin), access-policy panel (super_admin + operations), and role-restricted category visibility for finance, reviewer, and support roles.

## 5. Flow-Based Implementation Plan

Alignment rule for this section:
- Each `Flow 2.x` implementation item below maps directly to the corresponding `Feature Flow 2.x` above.
- The admin dashboard is the back office for the already-completed `partner_app`, so admin flows should consume, moderate, approve, reconcile, or configure partner-originated data rather than duplicate partner UI behavior.
- Initial implementation phase should be frontend/module-first with local/mock adapters, preserving room for later Django integration.
- The first implementation pass should establish Flow `2.0` as a polished admin shell and reusable operational UI primitives that all later flows plug into.

### Flow 2.0: Admin Shell and Platform Foundation
- Implementation steps:
  - Scaffold the admin application foundation, routing structure, layout, and global styles.
  - Build a polished admin shell with sidebar navigation, top bar, global search entry, role/session controls, notifications entry, and responsive layout behavior.
  - Create reusable operational UI primitives: KPI/stat cards, queue widgets, data tables, filter bars, status badges, drawers, audit timelines, alerts, and empty/error/loading states.
  - Add scaffold routes for all major admin sections so information architecture is fixed before deeper feature work.
- Required tests:
  - Unit: shell navigation config, status badge variants, shared component rendering.
  - Integration: layout routing, shell persistence across routes, responsive navigation behavior.
  - E2E: admin shell loads, navigates across scaffolded routes, and remains stable across key viewport sizes.
- Success criteria:
  - The admin platform has a distinctive, polished shell suitable for all later back-office flows.
  - Shared operational primitives are reusable and stable across routes.
  - Information architecture is fixed early enough to support later flow implementation without major shell rework.
- Status:
  - Completed.
  - Implemented with a polished dashboard home, shared admin shell, responsive navigation, scaffolded module routes, and reusable review/timeline/filter/stat primitives.
  - Verified with `npm test`, `npm run build`, and `npm run test:e2e`.

### Flow 2.1: Admin Authentication and Access Control
- Implementation steps:
  - Build admin sign-in/sign-out/reset-password screens and trusted-session handling.
  - Add role-based route protection and MFA/2FA challenge scaffolding.
  - Add session/device management UI.
- Required tests:
  - Unit: credential validation, role checks, session lifecycle.
  - Integration: login -> MFA -> dashboard access -> logout.
  - E2E: admin sign-in and protected route access by role.
- Success criteria:
  - Only authorized roles can access protected admin surfaces.
  - Session and MFA flows are deterministic and test-covered.
- Status:
  - Completed.
  - Implemented with signed server-verified admin session cookies, seeded role fixtures, middleware-enforced route protection, MFA challenge flow, sign-in/sign-out/reset-password routes, and session/device management UI.
  - Verified with `npm test`, `npm run build`, and `npm run test:e2e`.

### Flow 2.2: Admin Dashboard and Operations Overview
- Implementation steps:
  - Build admin dashboard summary cards, operational queue widgets, alerts, and recent activity.
  - Wire dashboard cards to verification, moderation, settlement, and incident queues.
- Required tests:
  - Unit: metric formatting and dashboard card transforms.
  - Integration: dashboard aggregation and queue navigation.
  - E2E: dashboard drill-down into operational queues.
- Success criteria:
  - Dashboard highlights actionable operational work clearly.
  - Queue navigation is stable and test-covered.
- Status:
  - Completed.
  - Implemented with role-aware metrics, operational queue widgets, alerts, recent activity, and direct drill-down links into verification, moderation, support, finance, and governance surfaces.
  - Verified with `npm test`, `npm run build`, and `npm run test:e2e`.

### Flow 2.3: Partner Verification and Lifecycle Management
- Implementation steps:
  - Build verification review queue and partner verification detail surfaces.
  - Add approve/reject/suspend/request-more-info actions with notes/history.
  - Align admin decision outputs to partner verification states and notifications.
- Required tests:
  - Unit: verification action guards and status transitions.
  - Integration: partner verification review -> decision -> notification.
  - E2E: admin reviews and resolves a partner verification case.
- Success criteria:
  - Verification decisions propagate cleanly to the partner lifecycle.
  - Queue signals, case detail, history, and decision consequences stay connected to the selected verification case.
  - Invalid decision actions are not exposed as valid case controls.
  - Review history is preserved and auditable.
- Status:
  - Completed.
  - Implemented with a verification queue workspace, partner verification detail surface, internal review notes, document summary, decision history, and admin actions for approve, reject, request-more-info, and suspend lifecycle control.
  - Verification outputs stay aligned with the completed `partner_app` status model: verification uses `pending`, `in_review`, `approved`, `rejected`, while partner lifecycle uses `pending`, `verified`, `rejected`, `suspended`.
  - Verified with `npm test`, `npm run build`, and `npm run test:e2e`.

### Flow 2.4: Partner Account Management
- Implementation steps:
  - Build searchable partner list and partner detail portfolio view.
  - Add limited metadata editing, lock/unlock, soft-delete/restore controls.
- Required tests:
  - Unit: filter logic and account lifecycle guards.
  - Integration: search/filter -> detail -> action -> updated state.
  - E2E: admin manages a partner account lifecycle action.
- Success criteria:
  - Admin can locate and manage partner records efficiently.
  - Sensitive lifecycle actions are constrained by policy and role.
- Status:
  - Completed.
  - Implemented with URL-synced partner directory, metadata editing (market owner, support tier, priority, note), lock/unlock/restore lifecycle controls, role-gated policy enforcement, and passing unit/integration/E2E validation.

### Flow 2.5: Listing Moderation (Stays and Transfers)
- Implementation steps:
  - Build moderation queues for stay and transfer listings.
  - Add review panels, moderation reasons, correction requests, bulk actions, and emergency takedowns.
  - Align moderation outputs to partner-side listing states and notifications.
- Required tests:
  - Unit: moderation state transitions and reason validation.
  - Integration: queue review -> approve/reject/send-back flow.
  - E2E: moderation of stay and transfer listings.
- Success criteria:
  - Moderation decisions align with partner listing lifecycle semantics.
  - Bulk and emergency actions are safe and auditable.
- Status:
  - Completed.
  - Implemented with separate stay/transfer queues, listing detail review panels, approve/reject/send-back/flag/emergency-unpublish actions, moderation reason capture, bulk-action support, and partner-app-aligned listing lifecycle semantics.

### Flow 2.6: Catalog and Content Quality Controls
- Implementation steps:
  - Build quality-control dashboards for duplicates, taxonomy violations, geo-data checks, and policy flags.
  - Add taxonomy standardization and flagged-listing resolution tools.
- Required tests:
  - Unit: quality flag and taxonomy rule logic.
  - Integration: quality control review -> correction -> resolved state.
  - E2E: admin resolves a flagged catalog issue.
- Success criteria:
  - Content-quality controls reinforce partner data-quality workflows.
  - Taxonomy and validation actions are consistent across catalog surfaces.
- Status:
  - Completed.
  - Implemented with a catalog quality workspace, flagged catalog-issue queue, taxonomy rule management panel, and flag resolution controls covering duplicates, geo-data, policy violations, and taxonomy mismatches.

### Flow 2.7: Business API Client Management
- Implementation steps:
  - Build API client review queue, key lifecycle management, plan assignment, and blocking controls.
  - Add usage and quota visibility.
- Required tests:
  - Unit: key lifecycle and rate-plan rule checks.
  - Integration: approve/reject client -> issue key -> change quota.
  - E2E: admin manages an API client lifecycle.
- Success criteria:
  - API clients can be governed end to end from the admin dashboard.
  - Key and plan operations are secure and traceable.
- Status:
  - Completed.
  - Implemented with an API client directory, approval/rejection workflow, key generation/revocation/regeneration controls, usage-plan and rate-limit assignment, client blocking, and quota visibility.

### Flow 2.8: API Governance and Monitoring
- Implementation steps:
  - Build API traffic, latency, errors, and rate-limit monitoring views.
  - Add client activity history and abuse investigation tooling.
- Required tests:
  - Unit: monitoring transforms and anomaly rules.
  - Integration: metrics view -> client investigation -> governance action.
  - E2E: admin inspects and acts on an API anomaly.
- Success criteria:
  - API health and abuse signals are discoverable and actionable.
  - Governance actions are linked to client histories and logs.
- Status:
  - Completed.
  - Implemented with endpoint-level traffic, latency, and error-rate monitoring, rate-limit violation logs, per-client access-history views, and governance actions for abusive or failing API clients.

### Flow 2.9: Pricing, Commission, and Commercial Controls
- Implementation steps:
  - Build commission and pricing-rule management surfaces.
  - Add manual financial adjustment flow with audit trail.
- Required tests:
  - Unit: fee-rule and adjustment validation.
  - Integration: update commercial rule -> audit log -> downstream visibility.
  - E2E: admin updates commission/service fee settings.
- Success criteria:
  - Commercial controls are explicit, auditable, and policy-safe.
  - Rule changes can be reasoned about and traced.
- Status:
  - Completed.
  - Implemented with commission and service-fee rule management, manual financial adjustment workflow with required justification, full audit trail for all commercial-control changes, and role-gated finance/super_admin access.

### Flow 2.10: Notifications and Messaging
- Implementation steps:
  - Build admin messaging composer for direct and broadcast partner communications.
  - Add targeting, channel selection, and message audit metadata.
- Required tests:
  - Unit: audience targeting and message validation.
  - Integration: compose -> send -> delivery metadata recorded.
  - E2E: admin sends partner-facing communication successfully.
- Success criteria:
  - Messaging aligns with partner-side notifications and audit needs.
  - Broadcast actions are controlled and traceable.
- Status:
  - Completed.
  - Implemented with a partner-messaging composer supporting direct, transactional, and broadcast channels, audience segment targeting, delivery-status tracking, and message-audit metadata.

### Flow 2.11: Reporting and Analytics
- Implementation steps:
  - Build reporting dashboards for partner growth, verification funnels, listing conversion, regional supply, and API adoption.
  - Add CSV export support.
- Required tests:
  - Unit: analytics aggregation and report transforms.
  - Integration: filter/report/export workflow.
  - E2E: admin generates and exports a report.
- Success criteria:
  - Reports answer operational and leadership questions clearly.
  - Exports reflect filtered/admin-selected reporting context.
- Status:
  - Completed.
  - Implemented with partner-growth, verification-funnel, listing-conversion, regional-supply, and API-adoption dashboards, timeframe/region filter controls, and CSV export with export-record tracking.

### Flow 2.12: Audit, Compliance, and Security
- Implementation steps:
  - Build audit log explorer, traceability views, and compliance export tools.
  - Add access policy and retention-control surfaces where applicable.
- Required tests:
  - Unit: audit filtering and export formatting.
  - Integration: critical admin action -> audit record visibility.
  - E2E: admin reviews and exports compliance evidence.
- Success criteria:
  - Audit coverage is visible and trusted for high-risk workflows.
  - Compliance support data is exportable and role-restricted.
- Status:
  - Completed.
  - Implemented with a role-filtered audit log explorer (8 event categories, 35+ actions), compliance evidence export with minimum-16-char justification, role-restricted category visibility (finance excludes admin_access; reviewer/support see verification, partner lifecycle, listing, and API governance only), retention-config panel (super_admin only), access-policy panel (super_admin + operations), and 21 unit / 5 service / 11 workspace / 6 E2E tests passing.

### Flow 2.13: System Configuration and Master Data
- Implementation steps:
  - Build countries/cities/service-area management, taxonomy management, moderation templates, feature toggles, and static-content configuration.
  - Add dependency validation before configuration publish.
- Required tests:
  - Unit: config validation and dependency checks.
  - Integration: update master data -> downstream read surfaces reflect changes.
  - E2E: admin changes configuration safely.
- Success criteria:
  - System configuration is centralized and test-covered.
  - Master data updates propagate predictably to partner/admin workflows.
- Status:
  - Completed.
  - Implemented with a full five-section configuration workspace: taxonomy items, feature toggles, service regions (countries/cities/service areas), moderation templates, and static content (terms, policy, help docs, announcements). 31 seeded records across all sections. Role-gated actions: super_admin has full access (publish, deprecate, archive, activate/deactivate regions); operations can only toggle features. Dependency validation: city/service_area activation requires active parent region; moderation template archiving blocked when usageCount > 0; sole published terms/policy document cannot be archived. URL-synced filter state (q, section, category, area, status, item), operator note validation (min 12 chars), audit record with queued_for_backend status. Section-aware filter UI (category/area filters shown conditionally). 208 unit/integration/workspace tests passing, build clean.

### Flow 2.14: Support and Incident Tools
- Implementation steps:
  - Build partner issue tracking, internal notes, escalation workflow, incident log, and safe diagnostics surfaces.
  - Add linkage to partner/account/listing context where relevant.
- Required tests:
  - Unit: issue and escalation state transitions.
  - Integration: incident creation -> escalation -> resolution logging.
  - E2E: admin handles a partner issue end to end.
- Success criteria:
  - Support and incident workflows are operationally clear and traceable.
  - Notes, escalation, and diagnostics remain safe and role-aware.
- Status:
  - Completed.
  - Implemented with a support and incidents workspace covering partner issue triage, internal note capture, incident flagging, escalation workflow, resolution logging, and safe diagnostics snapshots. Seeded cross-surface context links connect cases to partner accounts, moderation, verification, and finance follow-up. Role-aware behavior: `support`, `operations`, and `super_admin` can log notes, flag incidents, escalate, resolve, and run diagnostics; `reviewer` and `finance` remain read-only on the route. URL-synced queue filters (`q`, `status`, `severity`, `queue`, `incident`, `case`) keep support state shareable. Diagnostics remain explicitly safe by recording masked operational checks only and no secrets. Added unit, integration, workspace, and Playwright coverage for end-to-end handling of a partner issue.

### Flow 2.15: Financial Operations and Settlement Management
- Implementation steps:
  - Build partner settlement operations dashboard and reconciliation surfaces.
  - Add settlement-rule configuration, failure handling, retry tooling, statement generation, and refund follow-up workflow.
  - Align all settlement and refund status semantics with completed partner Flows 2.14 and 2.15.
- Required tests:
  - Unit: reconciliation logic, settlement run transforms, refund/escalation rules.
  - Integration: settlement review -> retry/follow-up -> audit visibility.
  - E2E: admin reviews settlement operations and refund follow-up flow.
- Success criteria:
  - Admin back-office settlement operations correctly supervise partner settlement flows.
  - Financial audit logs and reconciliation evidence are complete and test-covered.
- Status:
  - Completed.
  - Implemented with a finance-only financial operations workspace covering partner-facing settlement status supervision, admin settlement run tracking, reconciliation evidence, retry tooling, settlement statement generation, and refund follow-up/recovery. The flow keeps partner settlement statuses (`pending_completion`, `processing`, `paid`, `failed`, `reversed`) separate from admin run statuses (`queued`, `processing`, `completed`, `partial`, `failed`) and refund statuses (`requested`, `partner_notified`, `refunded`, `disputed`, `recovered`) in line with `AGENTS.md`. Seeded linked context connects finance work to partner accounts, support incidents, commercial controls, and payout review. Added unit, integration, workspace, and Playwright coverage for retry, reconciliation, statement generation, and refund follow-up handling.

### Flow 2.16: Settlement Account (Payout Method) Review and Security Controls
- Implementation steps:
  - Build settlement account review queue, masked payout-method detail views, fraud/risk flags, and settlement hold controls.
  - Add approve/reject/reverify actions with reason codes and role-restricted data access.
  - Align admin payout-method review workflow with completed partner Flow 2.15 submission/verification behavior.
- Required tests:
  - Unit: role-based masking, fraud-flag rules, hold eligibility, and review reason validation.
  - Integration: payout-method submission appears in admin queue -> decision -> downstream state update.
  - E2E: admin reviews and resolves a settlement account verification case.
- Success criteria:
  - Sensitive payout data is masked and role-restricted appropriately.
  - Admin review and hold controls integrate cleanly with partner payout-method flows.
- Status:
  - Completed.
  - Implemented with a finance-governed payout review workspace covering partner-submitted settlement-account cases, finance-only unmasked field access, super-admin masked review visibility, fraud/risk flags, manual settlement hold controls, and approve/reject/reverify actions with reason codes. The flow now mirrors partner Flow 2.15 payout-method semantics by keeping verification states aligned to `pending`, `verified`, and `rejected`, while seeded cases reflect OTP-backed submission, name-match checks, re-verification after changes, and downstream settlement readiness impact. Added unit, integration, workspace, and Playwright coverage for role-based masking, reason validation, hold eligibility, approval, rejection, and re-verification handling.

### Flow 2.17: Admin User Management and Access Governance
- Implementation steps:
  - Build admin directory, pending-invite list, and admin detail surfaces.
  - Add invite, resend-invite, revoke-invite, activate/deactivate, and role-assignment actions.
  - Surface MFA state, recent access/session context, and permission policy summaries for each admin account.
  - Add configurable confirmation or approval controls for sensitive grants such as `super_admin` and `finance`.
- Required tests:
  - Unit: role-assignment guards, invite state transitions, deactivation rules, and sensitive-role approval requirements.
  - Integration: invite -> pending/accepted state -> role change -> access-policy update.
  - E2E: super admin manages an internal admin account and audit trail.
- Success criteria:
  - Admin access is managed explicitly inside the back office instead of only through seeded or external account setup.
  - Role changes, invites, and account status changes are auditable and policy-aware.
  - Sensitive roles are protected by explicit confirmation or approval rules where required.
- Status:
  - In progress.
  - Frontend workspace implemented: admin directory, pending invites, activation and deactivation controls, resend and revoke invite actions, MFA posture, recent session context, permission policy summaries, and role assignment. Sensitive grants into `finance` and `super_admin` require explicit confirmation in the workspace. Local audit history records governance actions.
  - Currently wired to `mockAdminUsersRepository` in `src/modules/admin-users/service.ts`. Real backend (AdminInvitation model, invite/activate/deactivate/assign-role endpoints, accept-invite page) is pending implementation as Phase 2.5 in `api/plan.md`.
  - Remaining work: replace `mockAdminUsersRepository` with real API calls, add `/auth/accept-invite` page, run end-to-end signoff once backend is live.

## 6. Test Strategy by Module

### Shell and Platform Foundation Module
- Unit: navigation config, shell primitives, responsive state handling.
- Integration: route framing, shell persistence, scaffold-route loading.
- E2E: shell navigation and shared layout behavior across viewports.

### Auth and Access Module
- Unit: credential validation, MFA/2FA rules, role guards.
- Integration: session lifecycle and protected-route enforcement.
- E2E: admin sign-in and role-based access.

### Verification and Partner Operations Modules
- Unit: decision guards, lifecycle transitions, queue transforms.
- Integration: partner verification and account-management workflows.
- E2E: review, approve/reject, and lifecycle actions.

### Moderation and Catalog Modules
- Unit: moderation states, taxonomy rules, flag handling.
- Integration: queue review, correction requests, catalog controls.
- E2E: admin moderation and quality remediation flows.

### API Governance Modules
- Unit: key lifecycle, plan/rate-limit rules, monitoring transforms.
- Integration: API client approval and governance actions.
- E2E: review and control of API clients.

### Finance and Settlement Modules
- Unit: reconciliation logic, masking rules, hold rules, settlement review logic.
- Integration: settlement operations, refund follow-up, payout-method review.
- E2E: financial operations and payout-method review workflows.

### Reporting, Audit, and Configuration Modules
- Unit: aggregation transforms, audit filtering, configuration validation.
- Integration: export flows, audit visibility, config publish behavior.
- E2E: report generation, compliance export, and system configuration flows.

## 7. Global Release Success Criteria

- All admin app features in scope are implemented per phase definition.
- All admin back-office workflows align with already-completed partner-side lifecycle semantics.
- Flow `2.0` admin shell and platform foundation is completed before deeper admin modules are marked complete.
- Unit, integration, and E2E coverage are required before a flow is marked completed.
- Zero critical security defects on admin authentication, access control, payout-data visibility, moderation, and settlement operations.
- Core admin flows complete successfully in UAT:
  - admin auth and role-based access
  - partner verification review
  - listing moderation
  - settlement operations and refund follow-up
  - payout-method review and hold controls
  - audit and compliance evidence review
