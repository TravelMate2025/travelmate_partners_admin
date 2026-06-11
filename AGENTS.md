# AGENTS.md - TravelMate Admin Dashboard

## Application Identity
- Product name: `TravelMate Admin Dashboard`
- App type: Internal admin/back-office web application
- Purpose: Enable internal teams to review partner verification, moderate listings, govern platform operations, supervise settlements, and manage payout-method security.

## Primary Users
- Super Admin
- Operations Admin
- Verification Reviewer
- Support Admin
- Finance Admin

## Scope of This App
The `admin_dashboard` is responsible for:
- Admin shell and platform foundation (global navigation, layout, operational primitives)
- Admin authentication and access control
- Admin user management, roles, and access governance
- Platform operations dashboard and queue visibility
- Partner verification review and lifecycle actions
- Partner account search, review, lock/unlock, and restore workflows
- Stay and transfer listing moderation
- Catalog quality controls and taxonomy standardization
- Business API client review and governance
- Platform notifications and partner communications
- Reporting, audit, compliance, and master-data management
- Support/incident operations
- Financial operations, settlement supervision, refund follow-up, and payout-method review

The `admin_dashboard` is **not** responsible for:
- Partner self-service onboarding, listing creation, or pricing management UI
- Partner-side KYC/KYB submission UI
- Partner-side wallet, payout-method entry, or refund-tracking UI
- Consumer/customer-facing marketplace experiences

## Relationship to Partner App
- The `admin_dashboard` is the back office for the completed `partner_app`.
- Admin flows should supervise, approve, reconcile, configure, or override partner-originated state rather than duplicate partner-side user journeys.
- Admin workflow outputs must align with the partner app’s domain/status models and notify or constrain partner-side experiences where appropriate.
- When the partner app already owns a user-facing lifecycle or status, the admin dashboard should consume and govern that model rather than invent a parallel partner-facing variant.

## Naming and Terminology Standards
Use these terms consistently across code, UI text, and docs:
- `TravelMate Admin Dashboard` (exact product name)
- `Partner` (preferred over Agent in labels unless policy/legal language requires otherwise)
- `Stay` (for accommodation inventory)
- `Transfer` (for taxi/ride inventory)
- Admin roles: `super_admin`, `operations`, `reviewer`, `support`, `finance`
- Verification statuses: `pending`, `in_review`, `approved`, `rejected`
- Verification-to-lifecycle mapping: verification `approved` -> partner lifecycle `verified`; verification `rejected` -> partner lifecycle `rejected`; `suspended` is an admin lifecycle state, not a verification status
- Partner lifecycle admin states: `pending`, `verified`, `rejected`, `suspended`
- Listing statuses: `draft`, `pending`, `approved`, `live`, `paused`, `paused_by_admin`, `rejected`, `archived`
- Partner-facing settlement statuses: `pending_completion`, `processing`, `paid`, `failed`, `reversed`
- Admin settlement run statuses: `queued`, `processing`, `completed`, `partial`, `failed`
- Refund statuses: `requested`, `partner_notified`, `refunded`, `disputed`, `recovered`

## Functional Modules
- `shell`: global layout, navigation, search entry, alerts rail, shared admin primitives
- `auth`: admin login, MFA/2FA, session/device management, role guards
- `admin-users`: admin directory, invites, role assignment, deactivation, access-governance actions
- `dashboard`: platform summary metrics, queues, alerts, activity stream
- `partner-operations`: partner search, profile review, lock/unlock, restore
- `verification-review`: KYC/KYB review queue, notes, approve/reject/suspend actions
- `listing-moderation`: stay/transfer moderation queues, decision actions, emergency takedowns
- `catalog-controls`: duplicates, geo-data checks, taxonomy normalization, policy enforcement
- `api-clients`: API access application review, key lifecycle, plans, rate limits
- `api-monitoring`: traffic, errors, latency, rate-limit violations, access history
- `commercial-controls`: pricing, commission, service fee, and manual adjustment controls
- `notifications`: partner-facing admin messages, announcements, transactional triggers
- `reports`: platform and partner analytics, exports
- `audit-compliance`: audit explorer, compliance exports, access policy context
- `system-config`: countries/cities, service areas, taxonomy, templates, feature toggles, help/static content
- `support-incidents`: partner issues, notes, escalation workflow, diagnostics
- `financial-ops`: settlement operations, reconciliation, refund follow-up, financial audit trails
- `payout-review`: settlement-account review queue, masking, risk flags, holds, approve/reject/reverify

## Route and Module Naming
- Route names should follow the current admin scaffold unless intentionally changed:
  - `/partners` is the route surface for partner operations
  - `/moderation` is the route surface for listing moderation
- Internal module/folder names may stay feature-oriented (`partner-operations`, `listing-moderation`) if they map clearly to those route surfaces.
- When docs mention a feature module and a route slug, prefer being explicit about both rather than assuming they match by name.

## Data and Security Rules
- Never store plaintext secrets or sensitive financial details in logs.
- Mask settlement account details in UI and logs for non-finance roles; only expose the minimum necessary fields.
- Encrypt sensitive personal and settlement account fields at rest.
- Enforce role-based access on every protected route and privileged action.
- Record audit events for critical admin actions:
  - admin invites, role changes, and admin account activation/deactivation
  - verification review decisions
  - partner lock/unlock/suspend/restore actions
  - listing moderation and takedowns
  - commission/service fee changes
  - settlement run, retry, failure, hold, and refund actions
  - payout-method approvals/rejections/reverification and hold toggles
- Protected pages must not rely on client-only authorization checks.
- Any action affecting money movement, verification, moderation, or partner access must be explicitly auditable.

## UX and Product Rules
- Prioritize fast operator workflows with clear queues, summaries, and next actions.
- Surface risk, backlog, and exception states early.
- Use actionable empty states and queue-zero states.
- Optimize for high-signal tables, filters, drawers, and detail panels instead of long-form partner-style wizards.
- Show clear decision outcomes and downstream impact where admin actions affect partner-facing state.

## Engineering Standards
- Use TypeScript for new application code.
- Use Next.js App Router (`src/app`) for all route definitions.
- Keep modules feature-based to match the functional modules above.
- Validate incoming data at boundary layers (client and server).
- Favor explicit domain types for admin-managed entities (`AdminUser`, `PartnerRecord`, `ModerationDecision`, `SettlementRun`, `PayoutReviewCase`).
- All modules must be thoroughly tested.
- Minimum expectation per module:
  - unit tests for business logic and edge cases
  - integration tests for queue/data flows and privileged actions
  - critical UI interaction tests where user decisions drive state changes
- Require explicit coverage for:
  - admin invitation, role assignment, and privileged access-governance actions
  - role-based access and masking
  - moderation and verification status transitions
  - settlement/reconciliation and refund follow-up rules
  - payout-method review, fraud flags, and hold controls

## Suggested Folder Structure (Next.js Reference)
- `src/app` (App Router pages, layouts, route groups, route handlers)
- `src/modules/auth`
- `src/modules/admin-users`
- `src/modules/dashboard`
- `src/modules/partner-operations`
- `src/modules/verification-review`
- `src/modules/listing-moderation`
- `src/modules/catalog-controls`
- `src/modules/api-clients`
- `src/modules/api-monitoring`
- `src/modules/commercial-controls`
- `src/modules/notifications`
- `src/modules/reports`
- `src/modules/audit-compliance`
- `src/modules/system-config`
- `src/modules/support-incidents`
- `src/modules/financial-ops`
- `src/modules/payout-review`
- `src/components/ui` (shared reusable UI primitives)
- `src/components/common` (cross-feature presentation components)
- `src/lib` (API clients, auth helpers, config, infra utilities)
- `src/shared` (constants, validators, shared helpers)
- `src/types` (shared domain and API contract types)
- `src/styles` (global styles, theme tokens)

## Next.js Architecture Rules
- Keep route concerns in `src/app`; keep business/domain logic in `src/modules`.
- Prefer Server Components by default; use Client Components only when interactivity is required.
- Co-locate feature-specific UI/hooks/services within each module.
- Keep admin queue orchestration and domain logic out of presentation components.
- Use shared UI primitives from `src/components/ui` to maintain consistency across dense operational surfaces.

## Performance Standards
- Optimize for Core Web Vitals on key admin pages (dashboard, moderation queues, verification review, financial operations).
- Target fast perceived performance on data-heavy views:
  - prioritize rapid initial table/dashboard visibility
  - avoid blocking filter/sort/search interactions
  - keep queue navigation responsive under large datasets
- Use lazy loading for secondary panels, exports, and heavy visualization widgets.
- Cache stable reference data (taxonomies, templates, supported regions, role metadata) appropriately.
- Paginate or virtualize large datasets where needed.
- Monitor performance regressions on moderation, reporting, and settlement operations surfaces before release.

## Delivery Priorities (MVP)
1. Admin shell and platform foundation
2. Admin auth and role-based access
3. Admin user management and access governance
4. Dashboard + operational queues
5. Partner verification review
6. Listing moderation and catalog controls
7. Financial operations and payout-method review
8. Audit, reporting, and support operations

## Definition of Done (Feature Level)
A feature is done when:
- Functional acceptance criteria are met
- Security, masking, and role-based access checks are in place
- Error, empty, loading, and exception states are handled
- Tests are implemented and passing for all affected modules
- Documentation is updated if behavior, scope, or status models change

## Change Management
- Keep shared status enums synchronized with the partner app and backend contracts.
- Any change to verification, moderation, settlement, payout-method review, refund, or partner lifecycle flows must include audit and rollback considerations.
- Any change to admin roles, invite flows, or privileged-access governance must include audit and approval considerations.
- Update this `AGENTS.md` when scope, naming, role boundaries, or module ownership changes.

## Resource Cleanup Rules
- Always clean up subscriptions, timers, event listeners, observers, and custom browser integrations.
- Clean up side effects properly on unmount and dependency changes.
- Abort stale requests when needed.
- Prevent state updates after unmount.
- Do not leak listeners across route transitions.

## Heavy Work Rules
- Never block the browser main thread.
- Use off-render or server-side processing for large data transformations, export preparation, reconciliation calculations, and analytics shaping.
- Do not perform expensive transformations inside render paths.
- Prefer server-side shaping before data reaches the UI.
- Use worker-based approaches only when truly necessary.

## Network Rules
- Use a centralized HTTP client abstraction.
- Route external API access through repositories/services.
- Handle errors with typed exceptions or normalized failures.
- Paginate large datasets.
- Reduce payload size where possible.
- Avoid over-fetching.
- Normalize backend responses before they reach UI components.
- Do not let raw backend response shapes leak into presentation code.
- Prefer server-side fetching for initial loads unless interactivity requires client fetching.

## Caching and Data Ownership Rules
- Treat caching as a first-class frontend design decision.
- Define a source of truth for every major data type.
- Do not duplicate server-owned data in client state without clear reason.
- Use explicit caching/revalidation behavior for each fetch path.
- Avoid mixing stale cached data and fresh interactive state without clear invalidation.
- Keep filter/tab/pagination/search state in URL when state is shareable or restorable.
- Derived UI state should be computed, not redundantly stored.

## Data Parsing and Mapping Rules
- Do not perform expensive data shaping inside components.
- Transform raw DTOs into domain-safe objects in the data layer.
- Validate external data before it reaches feature logic.
- Keep parsing, fallback, and mapping logic out of presentation code.

## State Management Rules
- Keep state minimal.
- Prefer server state on the server.
- Use URL state for shareable admin filters and queue state.
- Use local state for isolated interactions.
- Use shared client state only when multiple client components truly need synchronized operational context.
- Use immutable updates.
- Avoid unnecessary global mutable state.
- Do not mirror server state into client stores without need.
- Do not use global state where route state or local state is sufficient.

## Error Handling Rules
- Use exceptions in the data/integration layer.
- Use typed failures or normalized error objects in the application/domain layer.
- Never expose raw exceptions directly to UI.
- Presentation layer must map failures into clear operator-facing messages.
- Every major data-driven surface must support loading, empty, error, success, and exception states.
- Add retry behavior where appropriate.
- Use route-level and component-level error boundaries where appropriate.

## Dependency Management Rules
- Centralize shared service construction.
- Avoid ad hoc instantiation of shared clients across features.
- Inject repositories/services through explicit module boundaries.
- Keep feature dependencies testable and swappable.
- Prefer explicit factories/composition over hidden singleton sprawl.

## UI, Responsive, and Motion Rules
- Follow consistent spacing, hierarchy, and interaction patterns across operational surfaces.
- Use reusable components and avoid duplicated UI code.
- UI files must remain focused on presentation and interaction wiring, not domain/business logic.
- Standardize repeated admin patterns: data tables, filters, tabs, queue cards, review drawers, diff panels, audit logs, and export actions.
- All screens must support adaptive layouts across laptop, desktop, and tablet widths.
- Avoid hardcoded screen-size assumptions.
- Ensure dense admin controls remain readable and operable under zoom and larger text settings.
- Ensure dialogs, drawers, and detail panels remain usable at supported widths.
- Before marking any phase complete, test key admin flows at tablet and desktop widths, and confirm no clipped actions or inaccessible controls.
- Use motion sparingly and intentionally.
- Prefer subtle transitions and keep durations short.
- Avoid decorative motion on operational/admin surfaces.
- Respect reduced-motion preferences.

## Button and CTA Color Rules
- Use the TravelMate icon-derived palette for buttons and CTAs only.
- Primary button background: `#033D89`; text: `#FFFFFF`.
- Primary button hover background: `#052068`.
- Secondary/accent CTA background: `#FD6E1D`; text: `#FFFFFF`.
- Secondary/accent CTA hover background: `#EF5C12`.
- Keep button/CTA text contrast accessible (minimum WCAG AA contrast).

## UI File Size and Composition Rules
- Avoid oversized UI files; split components when a file grows beyond a maintainable size.
- As a guideline, refactor UI files approaching ~250-300 lines, especially when multiple concerns are mixed.
- Separate concerns clearly:
  - presentation in component files
  - data fetching and orchestration in module services/hooks
  - validation/parsing/mapping in data or domain layers
- Extract repeated JSX sections into subcomponents instead of long monolithic files.
- Keep page-level files thin by composing feature components.
- Keep component props explicit and typed; avoid passing unstructured objects when stable interfaces are possible.

## Frontend Security Rules
- Never trust client input.
- Validate user input before submission and again at the server boundary where applicable.
- Never expose secrets in client bundles.
- Keep client-safe and server-only environment variables clearly separated.
- Protected pages must not rely on client-only authorization checks.
- Sensitive admin actions must go through trusted server-side boundaries.
- Role restrictions must be enforced both in visibility and in action execution.
