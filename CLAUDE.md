# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ProcureMaster** is a B2B SaaS platform for procurement teams at SMBs (10–200 employees). It manages vendors, tracks procurement orders, and runs RFQ/RFP workflows. AI extracts terms from vendor documents, suggests and scores evaluation criteria, flags compliance risks, and generates comparison reports. A linear approval workflow then turns an approved vendor into a contract with renewal alerts.

Four user types:
- **Procurement Manager (PM):** power user, exactly one per org.
- **Department Head (DH):** raises requirements, read-only on evaluations.
- **Finance Approver (FA):** approves or rejects vendor selections.
- **Vendor:** external, invite-only portal at `/vendor`, fully isolated from internal data.

**Current state:** Phases 1–4 are complete (Foundation, Database, Authentication, Navigation Shell):
- Auth, onboarding and role-based redirects work.
- The internal app shell has a role-based sidebar with a collapse toggle, a top bar with the search overlay, a live notification bell and the avatar menu (with the dark mode toggle), plus a breadcrumb bar.
- The vendor portal has its own shell.
- Every route in the App Flow site map has a placeholder page.
- Phase 5 (PM Core) added the PM dashboard (stat cards with sparklines, pipeline snapshot, renewal alerts, recent activity), the drag-and-drop kanban with filters and inline search, the Create/Edit RFP modal, the RFP detail split view with Invite Vendor and Archive, and a vendor detail tab skeleton.

The next phase is Phase 6 (Vendor Portal). Build progress follows the phases in the Implementation Plan.

**Data conventions:**
- API routes call `logActivity()` on every state change.
- The client calls APIs through `apiFetch()` (`src/lib/api/client.ts`), with hooks in `src/lib/queries/`.
- Kanban drag uses a TanStack optimistic update, not Zustand.
- Forms use `useForm<z.input, unknown, z.output>`, and API schemas accept the parsed output.
- Deadlines and contract dates are calendar dates: format them with `formatDate()`/`daysUntil()` in `src/lib/format.ts`, which read only the `yyyy-mm-dd` part.
- Emails go through `sendEmail()` (`src/lib/email.ts`). Without `RESEND_API_KEY`, it logs the link to the dev-server console instead of sending.
- Deferred from Phase 5 to Phase 7: the Shortlist and Remove vendor-row actions (no API in Backend Schema §8; they need scoring).

**Shell conventions:**
- Pages render `<Breadcrumb>` (nested pages only), then `<PageContainer>` and `<PageHeader>` (`src/components/layout/`).
- Role access per route lives in `src/lib/auth/route-access.ts`, which the middleware enforces with a `?notice=forbidden` toast. Sidebar items live in `src/components/layout/nav-config.ts`. Both follow App Flow §2.1: the FA sees Dashboard, Approvals and Activity.
- The vendor portal pages live under `src/app/vendor/(portal)/`. The public invite pages under `src/app/vendor/invite/` have no shell.

**Auth conventions:**
- Read the role from JWT claims with `supabase.auth.getClaims()` plus `readAppClaims()` (`src/lib/auth/claims.ts`), never from `user.app_metadata`, which lacks the hook's claims.
- Route Handlers use `getRequestAuth()` (`src/lib/api/auth.ts`) and the helpers in `src/lib/api/responses.ts`.
- `src/middleware.ts` owns all page-level redirects: role areas, onboarding, and `?next=` deep links.
- Password-reset and team-invite emails use `supabase/templates/`. Both link to `/reset-password/{token_hash}`; invites add `?type=invite`. Restart Supabase after changing `config.toml`.
- Toasts fired on page load need a fixed `id`, because dev strict mode runs effects twice.

**Seed accounts** (local only, password `Password123!`): `pm@`, `dh@`, `fa@`, `vendor1@` and `vendor2@procuremaster.test`, all in the org "Northwind Trading" with one requirement and one RFP. The seeded PM has onboarding marked complete; sign up a new PM to test onboarding. Local emails (auth, password reset) land in Mailpit at http://127.0.0.1:54324.

## Reference documents are the source of truth

Everything in `Docs/` is authoritative. **Do not make architectural decisions that contradict these documents.** If a task would require deviating from them, stop and flag it before proceeding.

| Document | Governs |
|---|---|
| `AI_Procurement_PRD.docx` | Features, personas, scope and non-goals, non-functional requirements |
| `AppFlow_AI_Procurement.docx` | Every route, per-role access, screen contents, empty and error states, notification matrix |
| `TechStack_AI_Procurement.docx` | Exact pinned package versions, directory structure, client patterns, env vars |
| `BackendSchema_ProcureMaster.docx` | 18 tables, enums, RLS policies, functions and triggers, API endpoints, storage buckets, migration order |
| `ContentGuidelines_ProcureMaster.docx` | Design system: tokens, typography, spacing, component specs, `tailwind.config.ts` and `globals.css` (sections 14–15) |
| `ImplementationPlan_ProcureMaster.docx` | Phases 0–12 with task lists, verification checklists, Windows notes and the decision protocol |

The docs are `.docx`, so the Read tool can't open them directly. Extract the text with PowerShell:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead("Docs\BackendSchema_ProcureMaster.docx")
$r = New-Object IO.StreamReader($z.GetEntry('word/document.xml').Open())
($r.ReadToEnd() -replace '</w:p>', "`n" -replace '<[^>]+>', ''); $r.Close(); $z.Dispose()
```

### Decision protocol (Implementation Plan, Appendix B)

Before writing code, stop and ask if a task needs any of these:
- a data model, API behaviour or auth/RLS rule not in the Backend Schema doc
- a UI choice not in the Content Guidelines
- a library not in the Tech Stack doc
- feature behaviour where the PRD or App Flow is ambiguous

Also stop if a task would mean skipping a phase task or changing the schema beyond the Backend Schema doc. Ask in this format:

```
DECISION REQUIRED
I need to implement [X] but the planning documents do not specify [missing detail].
Option A: [description and implication]
Option B: [description and implication]
Which should I implement?
```

### Decisions made by the user (these override the docs)

1. **AI provider is Google Gemini, latest version.** Use the `@google/genai` SDK; the docs' `@google/generative-ai` is deprecated. The model is `gemini-3.8-flash` (latest generally available, chosen 2026-09-30); the Pro line is only `gemini-3.1-pro-preview`. Keep the model ID in one constant in `src/lib/gemini/client.ts` and re-check it is still current at the start of Phase 7. Wherever the docs say `gemini-1.5-pro-latest`, read this model instead.
2. **Local database workflow:** use `supabase db reset` to apply all migrations and then `supabase/seed.sql`. Do not use `supabase db push` or `supabase db seed` locally; `db push --linked` is only for the production project (Phase 12). Seed data lives in `supabase/seed.sql`, not in a `0027` migration.
3. **Added packages:** `recharts`, its peer `react-is` and `tailwindcss-animate`, all pinned exactly.
4. **`next@14.2.35`**, not 14.2.29: 14.2.29–14.2.34 carry the security advisory of 2025-12-11. `eslint-config-next` stays at `15.3.1`, because 14.x doesn't support ESLint 9.
5. **Phase 1 tooling adjustments:**
   - The `lint` script is `eslint .`. Next 14's `next lint` doesn't support the ESLint 9 flat config (`eslint.config.mjs`, which adapts `next/core-web-vitals` and `next/typescript` through FlatCompat).
   - shadcn/ui components are added with `npx shadcn@2.3.0 add <name>`, the last CLI version for Tailwind v3 and the "default" style. `shadcn@latest` targets Tailwind v4.
   - `tailwind.config.ts` adds two things to Content Guidelines section 14: `popover` colours (shadcn components need them) and `safelist: ['dark']` (otherwise Tailwind drops the `.dark` tokens).
   - Generated shadcn components may need small type fixes to compile under `exactOptionalPropertyTypes`.
6. **Supabase CLI is a project dev dependency** (`supabase` in `package.json`), not a global Scoop install. Always run it as `npx supabase <command>`.
7. **Feature decisions (2026-09-30):**
   - **Departments:** a fixed list in code (IT, Finance, HR, Operations, Marketing, Legal, Facilities), used by the RFP and requirement forms. There is no departments table.
   - **Vendor Notes tab:** left out for now. Vendor detail has three tabs: Documents, Scores and Compliance.
   - **Report share link:** left out for now. No "Copy Share Link" button.
   - **Uppercase:** follow the component specs. Table headers, sidebar section labels and kanban column titles use `uppercase`; everything else follows the no-all-caps rule.
   - **Sidebar:** has a collapse toggle, with the state in Zustand `useAppStore`.
   - **Seed test accounts:** all share the password `Password123!`.
8. **Schema fixes (Phase 2).** The migrations follow the Backend Schema exactly, except where a documented detail could not work as written. Every such fix is marked `-- NOTE` in `supabase/migrations/`:
   - RLS helper functions are created in 0021, before the policies that call them.
   - Vendor subqueries use `IN`, since one login can own several `vendor_accounts` rows.
   - UPDATE policies that change `status` have `WITH CHECK`. Without it, FA approve, PM recall and vendor submit were all rejected.
   - `create_contract_on_approval` is `SECURITY DEFINER`, so an FA approval can create the contract.
   - `handle_new_user` skips users without a role (vendors).
   - There are no `updated_at` triggers on tables that lack the column.
   - The auth hook has the grants and `search_path` Supabase requires.
   - The user-approved policies for `requirements`, `rfp_vendor_entries`, `vendor_invites`, `scoring_templates` and the `org-assets` and `contract-documents` buckets are there.

   Regenerate `src/types/database.ts` after any schema change. Write the output with UTF-8 (no BOM) rather than PowerShell's `>`, then run Prettier on it.
9. **No new tables** unless the system would break without one. Features with no table in the schema are listed below. When you reach one, first try to build it from existing tables and columns. If that's impossible, stop and ask before adding a table:
   - vendor Notes (append-only)
   - DH recommendation comments on reports
   - report share links (7-day expiry)
   - per-user email notification preferences (`/account`)
   - requirement attachments

### Known conflicts and gaps in the docs (flag these; do not resolve them silently)

1. **JetBrains Mono.** Content Guidelines specify this font, but no loading method is given.
2. **RLS pattern.** The Tech Stack doc's example policy queries a `users` table. The Backend Schema uses `profiles` plus JWT helper functions (`get_org_id()`, `is_pm()` and similar). The Backend Schema pattern governs.
3. **Wrong section references.** The Implementation Plan cites "Tech Stack sections 14/15" for `tailwind.config.ts` and `globals.css`. They are actually in **Content Guidelines** sections 14 and 15.
4. **Uppercase text.** Content Guidelines section 3.3 bans all-caps, but the table header (6.5), sidebar section label (5.2) and kanban column title (7.2) specs use `uppercase`.
5. **Sidebar collapse.** Content Guidelines 5.1 says the sidebar never collapses on desktop. The Tech Stack and Implementation Plan store a "sidebar collapsed" state in Zustand.
6. **`AUTH_SECRET`/`NEXTAUTH_SECRET`.** Listed as an env var, but auth is Supabase Auth, so its purpose is undefined.

## Architecture (big picture)

- **Stack:** Next.js 14 App Router, TypeScript 5 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Supabase (Postgres, Auth, Storage, RLS), Tailwind with shadcn/ui, TanStack Query and Table, Zustand, React Hook Form with Zod, dnd-kit, Resend with React Email, puppeteer-core with `@sparticuz/chromium`, and Vercel hosting and cron. Import alias: `@/*` → `./src/*`.
- **Tenancy:** `org_id` is on every table and is the isolation boundary. A Supabase `custom_access_token_hook` injects `app_metadata.{user_type, role, org_id}` into the JWT, and every RLS policy reads it through the helper functions. Without the hook (registered manually in Dashboard → Auth → Hooks), RLS doesn't work.
- **Two auth populations:**
  - Internal users are in `profiles`, which extends `auth.users`. The `handle_new_user` trigger creates the org and profile from signup metadata.
  - Vendors are in `vendor_accounts`. A fresh scoped record is created per invite and is never shared across RFPs or orgs. Invite tokens expire after 72h, enforced in app logic.
  - Vendors must never see scores, compliance flags, reports, other vendors, or the `rfps` table.
- **Data flow:**
  - RFP: `requirements` → `rfps` (the insert trigger auto-creates `evaluations`) → `rfp_vendor_entries` → `submissions` → `documents`.
  - Scoring: `evaluation_criteria` (weights sum to 100) → `vendor_scores` (both the AI score and the PM override are stored; `effective_score` is generated).
  - Approval: `approval_requests` (one pending per RFP, enforced by a unique index). The `approval_creates_contract` trigger creates the `contracts` row and sets the vendor to `contracted`.
- **Async AI pipeline:**
  1. Upload stores the file at `vendor-documents/{org_id}/{rfp_id}/{vendor_id}/{file}` and creates a document with status `queued`.
  2. It fires a non-blocking call to `/api/process/document/[id]` via `waitUntil()`.
  3. That route extracts text server-side (pdf-parse, mammoth or xlsx; never the model's file-upload API) and calls the model with a structured-JSON prompt. It stores the output in `raw_extraction` (JSONB) and promotes 8 fields to typed columns.
  4. The client polls every 5s. Empty extracted text means a scanned PDF: fail with the exact message from the Tech Stack doc (section 6).

  All AI calls are server-side only, with a 120s timeout. Prompts live in `src/lib/gemini/prompts.ts`.
- **Background jobs:** Vercel Cron → `/api/cron/renewal-alerts` and `/api/cron/approval-sla`. Both must validate `CRON_SECRET`. No Redis or queues. `pg_cron` only purges notifications older than 90 days.
- **State:**
  - Server data lives only in the TanStack Query cache; query hooks go in `src/lib/queries/`.
  - Zustand (`src/stores/`) holds UI state only.
  - Zod schemas go in `src/lib/schemas/`, exporting both the schema and its inferred type.
  - Two Supabase clients: `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` (both via `@supabase/ssr`).
- **Routing:**
  - `src/app/(auth)/` holds login, signup, reset-password and onboarding.
  - `src/app/(dashboard)/` holds the internal shell, with nav items hidden per role (see App Flow section 2.1).
  - `src/app/vendor/` is the vendor shell, with no sidebar.
  - `/` redirects to `/login`, and `src/middleware.ts` guards the protected routes.

## Invariants

- Never disable RLS; write the correct policy instead. The service-role key is only used server-side and is never exposed to the client.
- All schema changes go through migration files (`supabase migration new <name>`) in the Backend Schema order (section 10). Never apply them through the dashboard or apply SQL directly through the Supabase MCP server.
- Primary entities are soft-deleted (`is_deleted`). `activity_log` is append-only, written from API routes via `logActivity()` (`src/lib/activity.ts`) with a before/after JSONB diff.
- Global search uses the generated `tsvector` columns, never `ILIKE`.
- API errors return `{ error: string, code: string }`.
- Pin exact versions with no `^` or `~` (`.npmrc` has `save-exact=true`). Install from the lockfile with `npm ci`.
- **UI:**
  - Colours come only from the semantic tokens; no hex values and no `dark:` + raw-colour classes.
  - Mark all AI-generated content with a Lucide `Sparkles` icon placed before it.
  - Empty states are empty tables with their headers; no illustrations.
  - Import Lucide icons individually.
  - Toasts use Sonner, top-right. Form errors show inline, never as toasts.
- Build the happy path first; error, loading and empty polish is Phase 10. Work on a single `main` branch.

## Commands

The dev environment is Windows with PowerShell. If `npm`/`npx` fail with "running scripts is disabled", run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`. Local Supabase needs Docker Desktop (WSL 2 backend). Run `npx supabase stop` before shutting down.

```powershell
npm ci                                   # install exact lockfile versions
npm run dev                              # localhost:3000 (port busy: npx next dev -p 3001)
npm run build                            # must finish with 0 TypeScript errors
npm run lint                             # eslint . (flat config)
npx tsc --noEmit                         # type check only
npx prettier --write "src/**/*.{ts,tsx,css}"
npx shadcn@2.3.0 add <component>
npx supabase start                           # local stack; Studio at http://127.0.0.1:54323
npx supabase migration new <name>
npx supabase db reset                        # re-apply all migrations + supabase/seed.sql locally
npx supabase gen types typescript --local > src/types/database.ts
npx playwright test                      # E2E only, no unit tests
npx playwright test tests/rfp.spec.ts    # single spec file
npx playwright test -g "creates RFP"     # single test by title
npx playwright show-report
```

**Tests:** one spec per flow in `tests/`, page objects in `tests/pages/` (spec files never touch the DOM directly), role login fixtures in `tests/fixtures/auth.ts`. They run against local Supabase with seed data.
