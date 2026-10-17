# Changes to the Build Plan

Tracks every place the build differs from `Chage_Plans.md`: what the plan said, what we do instead, why, and how it works now.

Last updated: Oct 16, 2026 (Phase 3 client portal built)

**Status key**
- **Done**: built and working.
- **Planned**: agreed, to be built in the phase shown.
- **Needs your OK**: a proposal that changes the plan; not built until you agree.

## Summary

| # | Area | Change | Status |
|---|---|---|---|
| 1 | Stack | Front-end demo in the existing React + Vite app, backend simulated | Done |
| 2 | Database and security | Browser storage plus one access-rules function instead of Supabase RLS | Done |
| 3 | Login | Demo sign-in page; the role lives in the page address | Done |
| 4 | Seed data | In-app generator instead of a Python script | Done |
| 5 | Seed numbers | 24 field technicians in 12 two-person crews; 2,854 jobs | Done |
| 6 | Dispatch unit | Jobs are assigned to a crew, not to one technician | Done |
| 7 | Timesheets | Worked out from job times, not entered separately | Done |
| 8 | Job progress | Percentage bar replaced by status steps with times | Done |
| 9 | SLA rule | Defined: counts reactive commercial calls only | Done |
| 10 | First-time fix | Recorded per job; defaults to "yes" until close-out exists | Done (interim) |
| 11 | Audit log | Built into the app, shown in Settings | Done |
| 12 | Payments | Kept the old quote → deposit → paid flow | Done (to simplify in Phase 5) |
| 13 | Pagination | Added to long lists (not in the plan) | Done |
| 14 | Office calendar | Replaced by the dispatch board; the calendar is now for technicians only | Done |
| 15 | Branding | Renamed to Northline Mechanical, credited to OBATEK | Done |
| 16 | Old demo data | Old saved data is discarded | Done |
| 17 | Online booking | A booking becomes an unassigned job, with no separate "convert" step | Done |
| 18 | Customer texts | "Booked" on assign, "en route" when the tech sets off, switchable in Settings | Done; needs your OK |
| 19 | SMS | On-screen outbox instead of Twilio | Done |
| 20 | Live updates | Sync between windows of one browser instead of WebSockets | Done |
| 21 | Photos | Shrunk and stored in the browser instead of S3 | Done |
| 24 | Crew shifts | Each crew has working hours, used to flag conflicts | Done |
| 25 | Finishing a job | A job can only be completed through the close-out report | Done |
| 26 | Site history for techs | Techs see past visits by any crew at their sites | Done |
| 27 | Booking details | Morning/afternoon windows, a $95 emergency call-out fee, returning customers matched | Done |
| 28 | Tech updates on the job | Techs post notes and client updates, flag problems, and report running late or needing more time | Done |
| 22 | Job report PDFs | The browser's "Save as PDF" instead of generated files | Done |
| 29 | Client portal details | Live "today" panel, SLA chart counted by visit month, SLA wording shown | Done; wording needs your OK |
| 23 | AI assistant | In-browser search, with an optional link to DocumentQueryRAG | Planned, Phase 4 |

## Changes in detail

### 1. Stack: front-end demo instead of the full stack

- **Original plan:** Next.js front end, FastAPI backend, Supabase database, Twilio, S3, hosted on Vercel plus Railway or AWS.
- **Now:** everything runs in this React + Vite app (Figma Make). Backend parts are simulated inside the browser.
- **Why:** Figma Make has no backend, and a front-end-only demo can be shown on sales calls weeks sooner. This settles the open decision "Next.js for all three views, or keep the existing React front ends" in favour of React, for the demo.
- **How it works now:** all data lives in the browser (`src/data/store.ts`). The store's actions (add job, advance status, record payment…) are shaped like the planned API calls. When the backend is built, those actions become API calls and the screens don't need to change.

### 2. Database and security: browser storage plus one access-rules function

- **Original plan:** PostgreSQL with row-level security (RLS), so each commercial client only sees its own data.
- **Now:** data is saved in the browser's local storage. One function, `scopeFor` in `src/data/access.ts`, decides what each role may see:
  - **Office:** everything.
  - **Technician:** only their crew's jobs, and only the customers and sites on those jobs.
  - **Client portal:** only that account's jobs and sites.
- **Why:** RLS needs a database. Keeping every rule in one function means the demo still shows data isolation, and it maps one-to-one onto the RLS policies later.
- **How it works now:** every screen reads data through that one function, so no screen can show records outside its role.
- **Limit:** this is a demo safeguard, not real security, because anyone with the browser's developer tools can read local storage.

### 3. Login: demo sign-in page

- **Original plan:** authentication with three roles.
- **Now:** the app opens on a sign-in page with three cards: Office & dispatch (Jordan Carter, Dispatcher), Technician (pick one of 24), and Client portal (pick one of 3 accounts). No passwords.
- **Why:** there is no auth server. On a sales call, switching roles in one click also demos better than typing passwords.
- **How it works now:** the role is part of the page address, for example `#/office/jobs`, `#/tech/marcus/jobs` or `#/portal/harbourview`. Each browser window can show a different role side by side, which the Phase 2 "watch it appear on the phone" moment needs. An unknown technician, or a residential customer in the portal address, sends you back to sign-in. "Switch role" in the sidebar returns to the sign-in page.

### 4. Seed data: in-app generator instead of a Python script

- **Original plan:** a Python seed script to reset the demo before every call.
- **Now:** a TypeScript generator inside the app (`src/data/seed.ts`). "Reset demo data" is on the sign-in page and in Settings.
- **Why:** there is no Python or database in this setup, and a reset button is faster before a call than running a script.
- **How it works now:** the generator always produces the same customers and jobs, but dates are relative to today. Every reset, on any day, gives a live "today" with:
  - crews on site and en route
  - 6 online requests from last night waiting for a crew
  - an emergency no-heat call at Harbourview's Bayside Towers, requested at 6:50 AM with a 4-hour SLA
- When the real database exists, the same rules can be ported to the Python script.

### 5. Seed numbers

| | Plan | Built | Why |
|---|---|---|---|
| Staff | About 80 | 24 field technicians (12 crews × 2) plus 1 dispatcher | Only people who appear on the board, timesheets and payroll are modelled. Office and admin staff add nothing to the demo. |
| Crews | 12 | 12: 5 HVAC, 4 plumbing, 3 electrical, including one commercial crew per trade | As planned |
| Residential customers | About 400 | 400, each with one home site and equipment (furnace, water heater, panel, and sometimes AC) | As planned |
| Commercial accounts | 3 | Harbourview Property Management (8 buildings, 4 h SLA), Millbrook District School Board (10 sites, 8 h SLA), Cornerstone Market (5 stores, 6 h SLA) | As planned. The names are fictional placeholders. |
| Job history | About 2,500 | 2,854 jobs: about 2,600 completed over 6 months, plus today's 37 and the next two weeks | Extra jobs for today and upcoming days keep the board busy |
| RAG documents | Invented SOPs, warranty sheets, site notes | 6 SOPs, 3 warranty sheets (fictional brands Hearthline, Coolridge, Brookwell), a note for every commercial site, and close-out notes on every past job | No real manufacturer manuals, as the plan asks |

The whole seed takes about 2.4 million of the browser's roughly 5 million characters of storage.

### 6. Dispatch unit: jobs go to crews

- **Original plan:** "day view by crew", but also "assigning a tech".
- **Now:** each job is assigned to a crew. A technician sees every job for their crew.
- **Why:** trades crews usually run as a lead plus an apprentice in one van. Assigning crews gives 12 rows on the dispatch board instead of 24, which is easier to read and drag on.
- **How it works now:** each job has a crew (or none, if unassigned). Each technician belongs to a crew as Lead or Apprentice. The Crews page lists each crew's members, with a "View as" button for each one.

### 7. Timesheets: worked out from job times

- **Original plan:** "timesheets feeding payroll" (assumed to be entered separately).
- **Now:** hours are calculated from each job's arrival and completion times, for every member of the crew. They are not entered by hand. The old per-job "worker pay" and "mark worker paid" were removed.
- **Why:** this avoids double entry, since the tech already taps Arrived and Complete. It also stays within the browser storage budget, and keeps payroll consistent with the jobs.
- **How it works now:** the Crews page has a weekly timesheet showing jobs, hours, hourly rate and gross pay for each tech, plus a total payroll, browsable week by week. The tech's own page shows their hours and earnings this week, and Reports shows payroll this week.
- **Not yet covered:** travel time, breaks and overtime.

### 8. Job progress: status steps with times

- **Original plan:** not specified. The old app used a 0–100% bar that moved in 25% steps.
- **Now:** every job moves through **Unassigned → Scheduled → En route → On site → Completed**, and the time of each step is recorded.
- **Why:** response times, the SLA, timesheets and the "where's my tech?" story all need real times, and the steps match what a tech actually does.
- **How it works now:** the status button shows the next step ("On my way", "Arrived", "Complete"). The job drawer shows a progress timeline with the time of each step. Giving a job a crew makes it Scheduled; removing the crew makes it Unassigned again, unless the work has already started.

### 9. SLA rule

- **Original plan:** "SLA performance" and "response time against SLA", without a definition.
- **Now:** the SLA applies to commercial accounts, for **Urgent and Emergency calls only**. Response time runs from the customer's request to the crew arriving on site.
- **Why:** routine and planned work, such as quarterly maintenance booked weeks ahead, would always "miss" a 4-hour target and make the numbers meaningless.
- **How it works now:** the job drawer shows the response time with a "Within / Missed 4 h SLA" badge. The portal and client file show the "Within SLA" percentage for the last 90 days. In the seed data, about 88% of tracked calls meet their SLA.
- **Worth confirming with a real buyer:** many contracts measure response time to first contact, or to the start of work, rather than to arrival.

### 10. First-time fix

- **Now:** each completed job records whether it was fixed on the first visit. Seeded repairs have a fix rate of about 86%. Until the Phase 2 close-out sheet asks the tech, finishing a job with the "Complete" button records "yes".

### 11. Audit log

- **Original plan:** add an audit log table from day one.
- **Now:** built into the app. Every change records who made it (with their role), when, and what changed. Settings shows an activity log of the latest 500 entries, paged.
- **How it works now:** any change made in any role, such as a tech tapping "Arrived", appears with that person's name. Actions that change nothing are not logged.

### 12. Payments

- **Original plan:** not mentioned. Only the "mock QuickBooks export" is in scope.
- **Now:** the old CRM's office-only flow is kept: quote, then deposit, then paid in full. The seed fills it in realistically: commercial accounts pay 14–30 days after the job, and big residential jobs take a 30% deposit.
- **Why:** it already worked, and it gives the office view and Reports real money figures.
- **Phase 5:** reduce it to a simple billing section, and add the mock QuickBooks export.

### 13. Pagination

- **Not in the plan.** The Jobs and Clients pages show 50 rows per page, and job history in the client file and portal shows 25. Changing a filter or search goes back to page 1.
- **Why:** with 2,854 jobs, showing every row made the pages slow and impossible to scan.

### 14. Office calendar replaced by the dispatch board

- **Phase 1 (interim):** the office calendar opened on the day view with a crew filter, because 12 crews in one week view overlap too much to read.
- **Now (Phase 2):** the office home page is the **dispatch board** (see change 17). The week calendar is only used by technicians, on their Schedule page.

### 15. Branding

- The app was "WorkBench". It is now **Northline Mechanical** (HVAC · Plumbing · Electrical), with "Built by OBATEK" in the sidebar and on the sign-in page.
- All placeholder names are in one file, `src/brand.ts`, so the "Name the demo company" decision is a one-line change.

### 16. Old demo data

- The data saved by the old app is ignored, because the storage key changed and the data model is different. The old 9 demo jobs are gone. A backup of the original code is kept outside the project.

## Phase 2 changes

### 17. Online booking becomes an unassigned job

- **Original plan:** quote wizard plus "a convert to job step".
- **Now:** submitting the booking page creates an **Unassigned** job straight away (source: Online), plus a "booking received" text to the customer. The job appears at once in the dispatch board's "Waiting for a crew" tray.
- **Why:** the storyline says the request "lands as a new job". A separate inbox and convert step adds a screen and a click without adding to the story.
- **How it works now:**
  - The booking page is at `#/book` and needs no sign-in. It is linked from the sign-in page and from the dispatch page, and opens in a new tab.
  - It has 4 steps: service, details and urgency, day and time window, and contact details. A side panel shows a live estimate from the service's price range.
  - The confirmation screen shows the reference number and the exact text the customer would receive.
  - On the dispatch board, you drag a request from the tray onto a crew's row. The time snaps to the half hour, and a dashed preview shows where it will land and whether it fits.
  - On a touch screen, where dragging doesn't work, you tap **Place** on the request and then tap the board.
  - Dragging a booked job back to the tray unassigns it. Jobs that have already started can't be moved.

### 18. When the customer gets the "en route" text (built; needs your OK)

- **Original plan:** assigning a tech sends the customer an "en route" text.
- **Now (default):** assigning a crew sends a "booked" text with the day, time and lead tech. The "on the way" text goes when the tech taps **On my way**.
- **Why:** jobs are often assigned days ahead, so an "en route" text on assignment would be wrong. Sending it when the tech actually leaves matches real life, and that is the moment the "where's my tech?" story is about.
- **How to get the original behaviour:** Settings → **"On the way" text** → "As soon as a crew is assigned". Assigning then sends both texts. Moving a booked job to another crew, day or time sends a fresh "booked" text. Dropping a job back in the same spot sends nothing.

### 19. SMS: on-screen outbox

- **Original plan:** Twilio SMS.
- **Now:** texts are created automatically at four moments: booking received, crew booked, on the way, and job done. They appear on the office **Texts** page (filterable by type) and in each job's drawer under "Customer texts", but nothing is actually sent. The seed includes about 350 texts for today's and upcoming jobs, so the outbox has a history.
- **Why:** Twilio needs a server to keep its keys secret, and live texts during a demo cost money and can fail. Real sending comes with the backend.

### 20. Live updates

- **Original plan:** WebSockets for live dispatch updates.
- **Now:** every window of the **same browser** picks up changes saved by another window, in under a second. For example, assign a job in the dispatch window and it appears in the phone-sized tech window, or a booking made in the booking tab appears in the dispatch tray.
- **Limit:** a real phone won't see it, because that needs the backend. On calls, use two browser windows.
- **Limit:** if two windows change something in the same instant, the last save wins.

### 21. Photos

- **Original plan:** photos stored in S3.
- **Now:** photos taken or uploaded at close-out are shrunk in the browser (at most 720 px, about 90 KB each) and saved with the job, up to 4 per job. Before saving, the close-out checks there is enough browser storage, and if there isn't, it asks you to remove a photo or reset the demo.
- **Why:** there is no S3 without a backend, and browser storage is limited. About 2.5 million characters remain after the seed data, which is roughly 25 photos.

### 24. Crew shifts

- **Not in the plan.** Each crew now has working hours: 7 AM–4 PM or 8 AM–5 PM for most crews, and 10 AM–7 PM for the three commercial crews, so they can cover schools and stores after hours. Seeded jobs always fit inside their crew's shift.
- **Why:** "outside the crew's shift" is one of the three conflicts the dispatch board flags. The other two are the wrong trade (for example an HVAC job on a plumbing crew) and overlapping another of the crew's jobs.
- **How it works now:** the board shades off-shift hours. Each crew row shows its members and hours. A job in conflict gets a red outline and a "!" badge, with the reason when you hover. The header counts the day's conflicts. Dispatchers can still book a job with a conflict on purpose, and the confirmation message says what the conflict is.

### 25. Finishing a job goes through close-out

- **Phase 1:** "Complete" finished the job immediately and recorded "fixed first time = yes".
- **Now:** once a job is on site, the next step is **Close out**, which opens the close-out report. It needs:
  - notes on the work done
  - a yes or no on "fixed on this visit?"
  - the customer's name and signature, drawn with a finger or mouse

  Parts (with quantities and a running total) and up to 4 photos are optional. Saving completes the job, adds the hours to the timesheets, and sends the "job done" text.
- **Why:** this is module 4 of the storyline, and it makes first-time fix a real answer instead of a default.
- **Also:** tapping outside the report doesn't close it, so a signature and photos can't be lost by accident on a phone.

### 26. Site history for technicians

- **Phase 1 rule:** a technician saw only their own crew's jobs.
- **Now:** a technician also sees **completed visits by any crew** at the sites their crew is booked into. This appears under "Site history" on each job card, and as "Past visits at this site" in the job drawer. It still never shows other customers' sites or open jobs.
- **Why:** module 3 is about knowing the site's history and equipment before you walk in, and that history often comes from another crew. The rule lives in the same access function as every other rule, `src/data/access.ts`.

### 27. Booking page details

- **Not in the plan:** the following were invented for the demo.
  - Two time windows: morning (8 AM–12 PM) and afternoon (12–5 PM). Today's windows close an hour before they end.
  - Bookable days: the next 10 days, skipping Sundays.
  - A **$95 emergency call-out fee**, added to the estimate.
  - Commercial-only services (such as rooftop unit maintenance) are hidden from homeowners.
- **Returning customers:** a booking whose mobile number or email matches an existing homeowner is added to that customer's file, with no duplicate created. If the address entered differs from the one on file, it is noted on the job.
- **Worth checking with a real buyer:** their actual windows, call-out fee and service list.

### 28. Tech updates on the job

- **Not in the plan.** Found in Phase 2 testing: a technician on a job could only tap the status buttons and fill in the close-out report, with no way to tell the office or the customer what was happening.
- **Now:** every job drawer has a **Notes and updates** feed, and open jobs with a crew have an **On the job** section.
  - **Notes:** techs and the office post on the same feed. Each note is either **Crew and office** (internal) or **Also tell the client**. A client update shows in the client portal's job drawer and is also sent as a "Job update" text, because homeowners have no portal. The tech's job card shows the latest note.
  - **Flags:** "Waiting on parts" or "Needs office help". A flagged job gets an amber "Parts" or "Help" chip on the dispatch board, a badge in Jobs and on the tech's card, and the board header counts the day's flagged jobs. Close-out clears the flag.
  - **Running late** (Scheduled or En route, today only): +15, +30 or +60 min moves the start time.
  - **Need more time** (On site): +30 min, +1 h or +2 h extends the job.
  - Both time changes can text the customer the new time (on by default). The board moves or stretches the job straight away. If the change runs into the crew's next job or past their shift, the drawer warns about it and the board flags the conflict in red.
- **Still office-only:** title, crew, client, date, payments, Edit and Delete.
- **Access:** the rule lives in `scopeFor` in `src/data/access.ts`, like every other rule. Office sees every note, a tech sees every note on their crew's jobs, and a client sees only the updates written for them, never internal notes.
- **Seed:** today's flagged job (HVAC North, "Waiting on parts") has a tech note and an office reply, and one en-route job has a client update with its text.
- **Older data:** saved sessions and backups from before this change still load. They just start with no notes.

## Phase 3 changes

### 22. Job report PDFs

- **Original plan:** generated report PDFs stored in S3.
- **Now:** every completed job has a **service report**, opened from the job drawer ("View and save the report") or the **Report** button in the portal. It's laid out as a printed page, and **Save as PDF** opens the browser's print window, where you pick "Save as PDF". Printing hides the rest of the app.
- **What it shows:** the customer, site and service; the visit timeline (requested, on the way, arrived, completed); response time against the SLA; time on site and the crew; the work notes and first-time-fix answer; parts and quantities; client-visible updates; up to 4 photos; and the signature.
- **What it leaves out:** prices, which match the portal having no payment view, and internal notes. So the office and the customer get the same document.
- **Why:** no extra libraries are needed, and the result looks the same.
- **Limit:** the seeded history has no photos or drawn signatures, so older reports show "Signed on site". Close out a job yourself to see a full report.

### 29. Client portal details

- **Plan:** "job counts, visit status, SLA performance and download job reports."
- **Now:** the portal home has, from top to bottom:
  - **Headline numbers:** sites covered, open visits, completed in the last 30 days, and % within SLA over the last 90 days. These use the same calculations as the office client file.
  - **SLA performance, last 6 months:** one column per month, with the latest month labelled and a hover tooltip with the counts ("10 of 12 calls within SLA"). A **Table** switch lists every month. The office client file shows the same chart.
  - **Today at your sites:** each of today's visits with its live status ("On the way since 9:40 AM", "On site since…"), the latest client update, and, for urgent and emergency calls not yet reached, **"Arrival due by"** the SLA time, which turns red once it has passed. It updates as the crew moves.
  - **Your sites:** each site with its open visits, last visit date and % within SLA. Clicking one filters the visits.
  - **Service visits:** the full list, with a Report button on completed visits.
- **SLA counting:** a call counts in the month of its visit date, so the chart can be checked against the visit list, which shows "Within SLA" or "Missed SLA" on every tracked visit.
- **SLA wording on screen:** "Urgent and emergency calls, request to arrival". **Needs your OK** (P3-09), and is worth checking with a real buyer (see change 9).
- **Access:** reports only open for the signed-in account's own jobs, so a job ID from another account shows nothing.

## Planned changes (not built yet)

### 23. "Ask the job history" assistant (Phase 4)

- **Original plan:** the DocumentQueryRAG service.
- **Planned:** a search inside the browser over this site's past job notes, site notes, the SOPs and the warranty sheets. Answers show their sources. If a DocumentQueryRAG address is set up, the app uses the real service, and falls back to the built-in search if the service fails.
- **Why:** AI API keys can't be kept safely in a front-end app. The built-in search also means the demo works with no AI costs and no internet risk. This covers "cap LLM usage on the demo account" from the risks table.

## Open decisions from the plan

| Decision | Status |
|---|---|
| Target buyer: 50–200 staff trades company or a corporate facilities team | Still open; the build assumes a trades company |
| Base CRM | Decided in the plan |
| Next.js or keep the existing React front ends | **Decided Oct 15, 2026:** React + Vite for the demo (change 1) |
| Hosting | Still open. The demo is now a static site, so Vercel alone is enough until the backend exists. |
| IP terms in client contracts | Still open. The Phase 1 and 2 code was written fresh and copies no client code. |
| Demo company name | Still open; "Northline Mechanical" is a placeholder (change 15) |
| 10 hours a week and the Dec 6 target | Still open |
| **New:** when the "en route" text is sent | Built with the proposed default and a Settings switch; needs your OK (change 18) |
| **New:** SLA wording shown to customers | "Urgent and emergency calls, request to arrival"; needs your OK (change 29) |
