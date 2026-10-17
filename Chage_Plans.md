# OBATEK Field Ops Flagship Demo — Build Plan

Oct 14, 2026 · @Oluwadamilola

## Goal and target buyer

Build one flagship demo that shows OBATEK can run a multi-crew field operation from the first customer request to the final report. It replaces two overlapping CRM demos with one story a buyer can follow in 15 minutes.

- **Buyer:** owner or operations manager at a 50–200 person HVAC, plumbing or electrical company with several crews, a dispatcher and an office manager.
- **Their pain:** phone tag to book jobs, dispatch on whiteboards or spreadsheets, and customers phoning to ask "where's my tech?"
- **What the demo proves:** OBATEK can build and run a Collabaro-class system tailored to them, with AI built in.
- **What it is not:** a SaaS product to sell off the shelf. It is a showcase that leads to custom builds and paid pilots.

Done means: a live demo runs end to end with no errors, a 2-minute walkthrough video exists, and it has been used on at least 5 sales calls.

## What we're reusing

Most of the demo already exists in pieces; the work is merging them around one data model and one storyline.

| Existing asset | Role in the flagship | Work needed |
| --- | --- | --- |
| Field Operations & Payroll CRM | Core data model: jobs, technicians, timesheets, payroll | Source for timesheet and payroll patterns; the OBATEK arm is now the base (see the Agent build spec tab) |
| Just Jo's CRM + second CRM | Customer and job records, UI patterns | Pick the stronger UI, fold the rest in, retire the duplicate demo |
| DocumentQueryRAG | "Ask the job history" assistant for techs and office | Index job notes, site history and SOPs per customer site |
| Driver SMS Triage | Tech and customer text updates | Swap driver flows for "tech en route" and "job done" messages |
| Worker Portal quote wizard + estimator | Step 1 of the demo: customer books or requests a quote online, and it becomes a scheduled job | Add a "convert to job" step |

Code built for a paying client (Jo, the scheduler client) is reused only as patterns unless your contracts say you keep the IP.

## Demo scope and storyline

Six modules, demoed as one job moving through them. The two highlighted steps are what owners remember: a job booked without a phone call, and the portal their customers see.

&#91;embedded content: demo storyline · 6 modules, one job end to end\]

1. **Online booking:** a customer requests a furnace repair through the quote wizard, and it lands as a new job.
2. **Dispatch board:** drag-and-drop day view by crew, with conflicts flagged; assigning a tech sends the customer an "en route" text.
3. **Tech mobile view (web, phone-sized):** today's jobs, directions, and "Ask the job history" (RAG) for past visits and equipment at this address.
4. **Close out:** photos, notes, parts used, customer signature.
5. **Client portal:** commercial customers see job counts, visit status, SLA performance and download job reports. This is the feature that reads as "enterprise."
6. **Ops dashboard:** timesheets feeding payroll, jobs per crew, first-time fix rate, response time against SLA.

## Architecture and stack

One backend, one database, three front ends, all on the stack you already ship with.

| Layer | Choice | Why |
| --- | --- | --- |
| Database | PostgreSQL (Supabase) with row-level security | Already used in the Field Ops CRM; RLS shows client-portal data isolation |
| Backend | FastAPI, one service | Reuses existing endpoints; WebSockets for live dispatch updates |
| Front ends | Next.js app with three role views: office/dispatch, tech (mobile web), client portal | One codebase, role-based login shows access control |
| AI | DocumentQueryRAG service, Twilio SMS | All existing; connect through the booking and job APIs |
| Files | S3 for photos and generated report PDFs | Same pattern as the Cavanagh CRM |
| Hosting | Vercel (front end) + Railway or AWS (API) | Matches the Just Jo deployment; AWS if you want to show your cert |

Add an audit log table and role-based permissions from day one. They cost little and answer the first question a larger buyer asks.

## Seed data: the fictional demo company

An empty app demos badly, so the demo runs on a fictional company with six months of believable history. Name below is a placeholder.

- **Company:** "Northline Mechanical," about 80 staff, HVAC, plumbing and electrical, 12 crews.
- **Customers:** about 400 residential customers plus 3 commercial accounts on service contracts with SLAs (a property manager, a school board, a small retail chain). The commercial accounts power the client portal.
- **History:** roughly 2,500 past jobs with notes, parts and photos, so dashboards and RAG answers have something real to show.
- **RAG documents:** invented SOPs, warranty sheets and site notes. Avoid copyrighted manufacturer manuals.
- **Generator:** one Python seed script, so you can reset the demo before every call.

## Build phases and timeline

Seven weeks at about 10 hours a week around your day job, from Oct 19 to Dec 6. Each phase ends with something you can already show, so a sales call never waits for the whole build.

| Phase | Weeks | Deliverable | Demo-able when done |
| --- | --- | --- | --- |
| 1. Foundation | Oct 19 – Nov 1 | Merged data model, auth with 3 roles, seed script, deployed skeleton | Login as each role, browse seeded jobs |
| 2. Dispatch + tech view | Nov 2 – Nov 15 | Online booking, dispatch board with live updates, mobile tech view, close-out with photos | Assign a job and watch it appear on the phone |
| 3. Client portal | Nov 16 – Nov 22 | Portal with job status, SLA view, PDF job reports | A commercial customer checks their SLA |
| 4. AI layer | Nov 23 – Nov 29 | SMS updates, RAG on job history | Full storyline, request to report |
| 5. Polish + package | Nov 30 – Dec 6 | Ops dashboard, demo script, video, one-pager | Ready for sales calls |

If time gets tight, cut the ops dashboard to a single page before cutting the portal or the AI assistant.

## Sales packaging

The demo sells a paid pilot, not the whole platform.

- **2-minute video:** the storyline above, screen-recorded. Send it after cold calls and put it on LinkedIn and the OBATEK site.
- **15-minute live demo script:** open with their pain ("how does a customer find out when their tech is coming?"), run the storyline, end on the client portal.
- **One-pager:** the six modules, what it replaces (whiteboard, spreadsheet, phone tag), and one line on custom fit.
- **Pilot offer:** start with one or two modules (for example, dispatch + client portal) using the same structure as the estimator deal: a one-time setup fee plus a monthly fee covering hosting, API costs, support and a small block of change hours.
- **Proof:** add a short testimonial from Jo next to the demo.

## Out of scope and risks

**Not building now:** multi-tenant SaaS, native iOS/Android apps (mobile web is enough), offline mode, real accounting integration (a mock QuickBooks export is enough), SOC 2 or on-prem deployment.

| Risk | Fallback |
| --- | --- |
| 10 hours a week slips because of the day job and client work | Ship phase by phase; the demo is usable after phase 2 |
| Scope creep toward a full product | Anything not in the storyline goes on a "later" list |
| Demo breaks live on a call | Reset with the seed script before each call; keep the video as backup |
| AI costs during demos | Cap LLM usage on the demo account |
| Reusing client code without rights | Check the Jo and scheduler contracts before copying code |

## Open decisions

- [ ] Confirm the target buyer: 50–200 staff trades company (assumed here) or a corporate facilities team
- [ ] Base CRM: decided, the OBATEK arm, with DocumentQueryRAG and the client portal added (Agent build spec tab)
- [ ] Next.js for all three views, or keep the existing React front ends
- [ ] Hosting: Vercel + Railway, or AWS
- [ ] Check IP terms in client contracts before reusing code
- [ ] Name the demo company
- [ ] Confirm the 10 hours a week and the Dec 6 target
