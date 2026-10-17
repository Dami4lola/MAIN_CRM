# Phase Test Checklist

The tests to complete before calling each phase done. Each phase ends with something shown on sales calls, so a phase isn't finished until its tests pass.

Last updated: Oct 16, 2026 (Phase 3 built; manual tests to do)

## How to use this

- Run **"Every phase"** first, then the tests for the phase you just finished.
- Tick a box only after doing the steps and seeing the expected result. Write the date next to it.
- If a test fails, note what happened under the test, fix it, and re-run that test plus "Every phase".
- Tests marked *(automated)* were checked with scripts during the build. Tests marked *(manual)* need a person to click through in the browser.
- Use a fresh start for each phase: sign-in page → **Reset demo data**.

---

## Every phase (regression)

- [ ] **R-01 Types check.** Run `node_modules/.bin/tsc --noEmit -p .` → no errors.
- [ ] **R-02 Build works.** Run `node_modules/.bin/vite build` → finishes with no errors.
- [ ] **R-03 No console errors.** With the browser console open, sign in as each role and visit every page in the menu → no red errors.
- [ ] **R-04 Reset works.** Make a few changes, then Reset demo data → the changes are gone, and the activity log shows only "Reset demo data".
- [ ] **R-05 Reload keeps changes.** Make a change and reload the page → the change is still there.
- [ ] **R-06 Each role signs in.** Office, a technician and each of the 3 accounts all open on their own home page.
- [ ] **R-07 Narrow screens.** Check at about 1000 px wide, at about 700 px, and at phone width (375 px) → nothing overlaps, there is no sideways page scroll, and tables scroll inside their panel.
- [ ] **R-08 Storage budget.** In developer tools → Application → Local Storage, the `northline-field-ops-v3` entry is under 4.5 million characters.
- [ ] **R-09 Demo run-through.** Run the storyline steps finished so far, start to finish, in under 15 minutes with no workarounds.

---

## Phase 1: Foundation (finished Oct 15, 2026)

**Demo-able when done:** log in as each role and browse the seeded jobs.

### Build
- [x] **P1-01** Type check passes. *(automated, Oct 15)*
- [x] **P1-02** Production build passes. *(automated, Oct 15)*
- [x] **P1-03** All 14 pages render with no errors: sign-in, office schedule, jobs, clients, a commercial client file, a residential client file, crews, reports, settings, tech jobs, tech schedule, client portal, and two invalid addresses. *(automated, Oct 15)*

### Sign-in and roles
- [ ] **P1-04** Opening the app with no address shows the sign-in page with 3 cards. *(manual)*
- [ ] **P1-05** The Technician card lists 24 techs grouped under 12 crews; the Client portal card lists 3 accounts. *(manual)*
- [x] **P1-06** The address `#/tech/nobody/jobs` and the portal address of a residential customer (`#/portal/c5`) both fall back to the sign-in page. *(automated, Oct 15)*
- [ ] **P1-07** "Switch role" in the sidebar returns to sign-in. Signing in as someone else clears the search box and closes any open job. *(manual)*
- [ ] **P1-08** Two windows: open the office in one and a technician in another → each keeps its own role. *(manual)*

### Seed data
- [x] **P1-09** Counts: 2,844 jobs, 403 clients, 423 sites, 24 technicians, 12 crews. *(automated, Oct 15; 2,854 before Phase 2 made every job fit inside its crew's shift. The seed moves with today's date, so the total varies by day: 2,861 on Oct 16.)*
- [x] **P1-10** No job has a request time later than today. Every job has a valid start time. *(automated, Oct 15)*
- [x] **P1-11** About 88% of tracked commercial calls meet their SLA (121 of 138), and first-time fix on repairs is about 86%. *(automated, Oct 15)*
- [x] **P1-12** Reset produces the same data every time. *(automated, Oct 15)*
- [ ] **P1-13** Office home page (Dispatch): today shows jobs on site and en route, about 7 "waiting for a crew", including **1 emergency**. *(manual)*
- [ ] **P1-14** The emergency is "No-heat call" at Bayside Towers (Harbourview), requested at 6:50 AM. *(manual)*
- [ ] **P1-15** Open 3 random completed jobs: each has a job report with notes that name the equipment at that site, a parts list (on some), and "Signed off by". *(manual)*

### Access rules
- [x] **P1-16** A technician sees only their crew's jobs. Marcus Lee sees 263 jobs, all HVAC North. *(automated, Oct 15)*
- [x] **P1-17** The Harbourview portal sees only Harbourview: 215 jobs and 8 sites, nothing else. *(automated, Oct 15)*
- [ ] **P1-18** As a technician, the job drawer has no payment section, no Edit or Delete buttons, and no Clients or Reports menu items. *(manual)*
- [ ] **P1-19** As a client, the job drawer has no status button, no labour, no equipment list and no payments. The client sees the response time and SLA badge. *(manual)*
- [ ] **P1-20** As a technician, searching for a customer from another crew finds nothing. *(manual)*
- [ ] **P1-21** Only the office has Settings, in the sidebar and in the account menu. *(manual)*

### Job status flow
- [x] **P1-22** Giving a crew to an unassigned job makes it Scheduled. Each step then records its time, and an extra step after Completed does nothing. *(automated, Oct 15)*
- [ ] **P1-23** As a technician on My jobs → Today, tap "On my way", then "Arrived", then "Close out" and complete the report → the status updates each time, a message pops up, and the drawer timeline shows all the times. *(manual; since Phase 2, finishing goes through close-out, see P2-24)*
- [ ] **P1-24** Clicking a status button inside a table row doesn't open the job drawer. *(manual)*
- [ ] **P1-25** After completing a job, the tech's "Hours this week" goes up, and the Crews timesheet shows the hours for both crew members. *(manual)*

### Office forms
- [ ] **P1-26** Schedule job with crew "Unassigned" → the job appears in Jobs as Unassigned, and the menu count goes up by 1. *(manual)*
- [ ] **P1-27** Edit that job and pick a crew → it becomes Scheduled and the count goes down. *(manual)*
- [ ] **P1-28** For a commercial client, a Site dropdown appears and the job's address follows the chosen site. For a homeowner, the address is shown automatically. *(manual)*
- [ ] **P1-29** "+ New client" inside the job form → the new client is selected and their address is used. *(manual)*
- [ ] **P1-30** New commercial client with an SLA of 6 hours → it appears at the top of Clients marked "Commercial" with "1 site · 6 h SLA". *(manual)*
- [x] **P1-31** A client with jobs can't be deleted. A client without jobs is deleted along with their sites. *(automated, Oct 15)*

### Activity log
- [x] **P1-32** Every change is logged with the person's name and role, and changes that do nothing are not logged. *(automated, Oct 15)*
- [ ] **P1-33** Complete a step as a technician, then open office Settings → the log shows the tech's name, for example "Marcus Lee (tech)". *(manual)*

### Lists, pages and timesheets
- [ ] **P1-34** Jobs shows "1–50 of 2,844". Next and Previous page work. Changing a filter or the search returns to page 1. *(manual)*
- [ ] **P1-35** On Jobs, group by Crew → the group headings show totals for all matching jobs, not just the current page. *(manual)*
- [ ] **P1-36** Clients: the All / Commercial / Residential switch works, and commercial accounts are listed first. *(manual)*
- [ ] **P1-37** On a commercial client file, clicking a site filters the job history to that site, and clicking it again shows all sites. *(manual)*
- [ ] **P1-38** Crews timesheet: the Previous week button works, Next is disabled on the current week, and the total equals the sum of the rows. *(manual)*
- [ ] **P1-39** The Jobs page with no filters responds to typing in the search with no noticeable lag. *(manual)*

### Settings
- [ ] **P1-40** Export a backup, make a change, then import the backup → the change is undone. Importing an unrelated JSON file shows "That file isn't a Northline backup". *(manual)*
- [x] **P1-41** A backup from the old app version is rejected. *(automated, Oct 15)*

---

## Phase 2: Booking, dispatch board, tech view, close-out (Nov 2 – 15; tests passed Oct 16, 2026)

**Demo-able when done:** assign a job and watch it appear on the phone.

### Online booking
Several tests below say *Logic checked automatically Oct 15*: the rules were verified by script, but the screen itself still needs a click-through before you tick it.

- [x] **P2-01** The booking page opens from its own address without signing in, and works at phone width. *(passed Oct 16)*
- [x] **P2-02** You can't move to the next step with a required field empty, and each missing field shows a clear message. *(passed Oct 16)*
- [x] **P2-03** The instant estimate falls inside the catalog price range for the chosen service. *(passed Oct 16)*
- [x] **P2-04** Submitting creates an **Unassigned** job marked Online. The job keeps the customer details and preferred time, and appears in the dispatch tray, in Jobs and in the menu count. *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-05** A brand-new customer is created with a home site, and a returning customer (matched by phone or email) is not duplicated. *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-06** A "booking received" text appears in the outbox, and the confirmation screen shows the same text. *Logic checked automatically Oct 15.* *(passed Oct 16)*

### Dispatch board
- [x] **P2-07** One row per crew (12), hours along the top, and today's jobs in the right places. *(passed Oct 16)*
- [x] **P2-08** Dragging a job from the tray onto a crew and time assigns that crew and time, makes it Scheduled, and adds an activity-log entry. A dashed preview shows where it will land while you drag. *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-09** Dragging a job between crews or times updates it. Dragging it back to the tray makes it Unassigned. *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-10** Conflicts are flagged in red with a reason: two jobs overlapping on one crew, a job outside the crew's hours, and the wrong trade (for example a plumbing job on an HVAC crew). The header counts the conflicts, and hovering shows the reason. *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-11** The emergency no-heat call can be assigned in under 3 clicks or drags. *(passed Oct 16)*
- [x] **P2-12** The board stays usable with all of today's jobs, plus the tray, on a laptop screen. *(passed Oct 16)*
- [x] **P2-13** On a touch screen: tap **Place** on a request, then tap a crew's row → the job is booked at that time. Cancel in the blue banner stops placing. *(passed Oct 16)*

### Customer texts (outbox)
- [x] **P2-14** Texts fire at the right moments. With the default setting: "booked" when a crew is assigned or the job moves, "on the way" when the tech taps On my way, and "job done" at close-out. With Settings → "On the way" text → "As soon as a crew is assigned": assigning sends both "booked" and "on the way". *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-15** Each text shows the right customer name, time and tech name, with no blank placeholders. *Seeded texts checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-16** Each job's drawer lists its own texts. *(passed Oct 16)*

### Live updates between windows
- [x] **P2-17** With dispatch in one window and the assigned tech in a phone-sized window, assigning makes the job appear on the tech side within about 1 second, without reloading. *(passed Oct 16)*
- [x] **P2-18** The tech taps "On my way" → the board updates within about 1 second. *(passed Oct 16)*
- [x] **P2-19** Changes made a few seconds apart in the two windows are both kept. (Changes in the same instant: the last save wins, a known limit until the backend exists.) *(passed Oct 16)*

### Tech mobile view (test at 375 px wide)
- [x] **P2-20** Today's jobs appear as cards in time order, each with status, address and customer. *(passed Oct 16)*
- [x] **P2-21** "Directions" opens the address in Google Maps, and "Call" starts a phone call to the customer. *(passed Oct 16)*
- [x] **P2-22** Buttons are big enough to tap with a thumb, and nothing needs sideways scrolling. *(passed Oct 16)*
- [x] **P2-23** Past visits and equipment at the site are visible from the job. *(passed Oct 16)*

### Close-out
- [x] **P2-24** On an on-site job, "Close out" opens the close-out report instead of finishing the job immediately. Tapping outside the report doesn't close it. *(passed Oct 16)*
- [x] **P2-25** Notes, the fixed-on-this-visit answer and a signature are required, each with a clear message. Parts can be added, have their quantity changed with − and +, and are removed at 0. The parts total adds up. *(passed Oct 16)*
- [x] **P2-26** A photo taken (on a phone, the camera opens) or uploaded is saved small (about 90 KB or less each). A 5th photo is refused with a clear message (up to 4 per job), and a photo can be removed with ×. *(passed Oct 16)*
- [x] **P2-27** The signature pad works with a finger and a mouse, Clear works, and the signature appears on the job report. *(passed Oct 16)*
- [x] **P2-28** First-time fix is asked (yes/no). Saving completes the job with the time, notes, parts, photos and signature, shows them in the drawer's job report, and adds the hours to the Crews timesheet. *Logic checked automatically Oct 15.* *(passed Oct 16)*
- [x] **P2-29** After 10 photos across several jobs, R-08 (storage budget) still passes. When storage is full, the close-out says so and asks you to remove a photo or reset, and the app doesn't crash. *(passed Oct 16)*

### Checked automatically (Oct 15)
- [x] **P2-30** Seeded jobs for today and the next two weeks have no conflicts, and every seeded job ends inside its crew's shift. *(automated)*
- [x] **P2-31** A job that is en route, on site or completed can't be moved on the board. *(automated)*
- [x] **P2-32** Dropping a job back in the same place sends no extra text. *(automated)*
- [x] **P2-33** The status button stops at On site; completing is only possible through close-out. *(automated)*
- [x] **P2-34** Two jobs created before the screen refreshes get different job numbers. *(automated)*
- [x] **P2-35** The activity log records the customer (online booking), the office and the tech for their own actions. *(automated)*
- [x] **P2-36** All 17 pages render with no errors, including the booking page, dispatch board and Texts page. *(automated)*

### Tech updates on the job (added Oct 16)
Test with dispatch in one window and Marcus Lee (HVAC North) at 375 px in another. *Logic checked automatically Oct 16* means the rules were verified by script, but the screen still needs a click-through before you tick it.

- [x] **P2-37** After Reset, the dispatch board shows 1 job flagged "Parts" and "1 flagged by crews" in the header. Its drawer has a tech note and an office reply. *(passed Oct 16)*
- [x] **P2-38** The tech posts a "Crew and office" note → it appears in the office drawer within about 1 second, the activity log shows "Marcus Lee (tech)", and no text is sent. *Logic checked automatically Oct 16.* *(passed Oct 16)*
- [x] **P2-39** The tech posts with "Also tell the client" → a "Job update" text appears in the outbox and the drawer's Customer texts, with the tech's first name and no blank placeholders. *Logic checked automatically Oct 16.* *(passed Oct 16)*
- [x] **P2-40** For a Harbourview job, the portal drawer shows the client update but never the internal notes, and has nowhere to write. Another account sees neither. *Logic checked automatically Oct 16.* *(passed Oct 16)*
- [x] **P2-41** The office posts on the same feed → the tech sees it, and it shows as the latest note on the tech's job card. *(passed Oct 16)*
- [x] **P2-42** The tech flags "Waiting on parts" or "Needs office help" → the chip appears on the board, the badge appears in Jobs, and the header count goes up. Clear flag removes it. Close-out also clears it. *Logic checked automatically Oct 16.* *(passed Oct 16)*
- [x] **P2-43** Running late +30 on a scheduled job today → the job moves 30 minutes on the board, and the customer gets a text with the new arrival time. Unticking "Text the customer" sends no text. *Logic checked automatically Oct 16.* *(passed Oct 16)*
- [x] **P2-44** Need more time +2 h on an on-site job that runs into the crew's next job → the drawer shows the overlap warning and the board flags it in red. *Logic checked automatically Oct 16.* *(passed Oct 16)*
- [x] **P2-45** The tech still has no Edit, Delete or payment controls (P1-18). Notes, flag and time buttons are thumb-sized at 375 px, with no sideways scroll. *(passed Oct 16)*
- [x] **P2-46** Reload keeps notes and flags. Reset brings back only the seeded notes. A backup made before Oct 16 still imports. *Logic checked automatically Oct 16.* *(passed Oct 16)*

---

## Phase 3: Client portal (Nov 16 – 22; built Oct 16, 2026)

**Demo-able when done:** a commercial customer checks their SLA.

*Logic checked automatically Oct 16* means the rule was verified by script for all 3 accounts, but the screen still needs a click-through before you tick it.

- [ ] **P3-01** The portal home page shows sites, open visits, visits completed in the last 30 days and % within SLA. The numbers match the office client file for the same account. *Logic checked automatically Oct 16 (for example Harbourview: 8 sites, 20 open, 85% within SLA in both).*
- [ ] **P3-02** The 6-month SLA chart: each month's value matches a manual count from the visit list for one sample month. Hovering a column shows the counts, and the Table switch lists every month. *Logic checked automatically Oct 16: all 6 months, all 3 accounts.*
- [ ] **P3-03** The sites list shows every site with open visits and last visit date. Clicking a site filters the visits, and "Show all sites" clears it. *Logic checked automatically Oct 16.*
- [ ] **P3-04** A visit that is in progress shows its live status in "Today at your sites", for example "On the way since…" after the tech taps "On my way" in another window. Bayside Towers' no-heat call shows "Waiting for a crew" and its SLA arrival time.
- [ ] **P3-05** Job report: notes, parts, photos and signature, laid out on clean pages. "Save as PDF" in Chrome and Safari gives a readable file of 1–2 pages with no cut-off content and none of the app around it. Close out a job with 4 photos and a signature first, since seeded jobs have none. *Content checked automatically Oct 16.*
- [ ] **P3-06** Isolation: switching from the school board to Cornerstone changes every number and list, and no Harbourview site names appear anywhere. *Logic checked automatically Oct 16.*
- [ ] **P3-07** Isolation: opening another account's job (by search, or by pasting its job ID) shows nothing.
- [ ] **P3-08** A client can't change anything: there are no edit, status, note or payment controls. *Logic checked automatically Oct 16.*
- [ ] **P3-09** The SLA definition is shown in the portal ("Urgent and emergency calls, request to arrival"), and the wording has been agreed. *Shown: checked Oct 16. Wording: needs your OK.*
- [ ] **P3-10** The SLA chart reads cleanly at 375 px, about 700 px and 1280 px wide: labels don't collide, the tooltip stays on screen, and the chart works with the keyboard (Tab to a month shows its tooltip).

### Checked automatically (Oct 16)
- [x] **P3-11** Reports leave out prices and internal notes, for both office and client. *(automated)*
- [x] **P3-12** The office client file shows the same SLA chart as the portal. *(automated)*
- [x] **P3-13** Phase 2 checks still pass, and the seed still fits the storage budget (2.49 million characters). *(automated)*

---

## Phase 4: AI layer (Nov 23 – 29)

**Demo-able when done:** the full storyline, from request to report.

### "Ask the job history"
- [ ] **P4-01** Asking "what was done on the furnace last time?" at a site with history gives an answer from that site's past job notes, with the job and date as the source.
- [ ] **P4-02** Asking about a warranty or procedure (for example "is the igniter under warranty?") answers from the right warranty sheet or SOP, and names it.
- [ ] **P4-03** Answers never use another site's or another customer's notes, from the tech view or the office.
- [ ] **P4-04** A question with no relevant notes gets "I couldn't find that in this site's history", not a made-up answer.
- [ ] **P4-05** It works with no internet and no RAG service configured.
- [ ] **P4-06** If a RAG service address is configured, the app uses it, and falls back to the built-in search when the service is down. No API key appears in the app's code or network requests.
- [ ] **P4-07** The usage cap: after the set number of questions, the demo account shows a polite limit message.

### Texts
- [ ] **P4-08** Text templates are editable in Settings, and new texts use the edited wording.
- [ ] **P4-09** If real Twilio sending is connected: texts only go to the test number, and a failed send shows in the outbox without breaking the app.

### Full storyline
- [ ] **P4-10** In one run: book online → dispatch → tech on the way → arrived → ask the history → close out with a photo and signature → client sees it in the portal → download the report. Every step works with no reload.

---

## Phase 5: Ops dashboard and packaging (Nov 30 – Dec 6)

**Demo-able when done:** ready for sales calls.

### Ops dashboard
- [ ] **P5-01** Payroll for the week matches the Crews timesheet total exactly.
- [ ] **P5-02** Jobs per crew: totals match the Jobs page grouped by crew for the same dates.
- [ ] **P5-03** First-time fix rate and response time vs SLA match a manual count for one crew and one month.
- [ ] **P5-04** Charts have labels and readable numbers, and still read correctly on a projector or shared screen (check at 1280 × 720).
- [ ] **P5-05** The mock QuickBooks export downloads a file with the right columns and totals.
- [ ] **P5-06** If cut to a single page (the plan's fallback), the four headline numbers are still there.

### Packaging and launch
- [ ] **P5-07** The 15-minute demo script, run as written by someone other than the builder → under 15 minutes with no stalls.
- [ ] **P5-08** The 2-minute video covers all 6 modules and matches the current build.
- [ ] **P5-09** The one-pager lists the 6 modules, what it replaces (whiteboard, spreadsheet, phone tag) and the pilot offer.
- [ ] **P5-10** Works on Chrome, Safari, Edge and an iPhone or Android phone (for the tech view).
- [ ] **P5-11** The hosted demo address loads in under 3 seconds on a normal connection, and Reset works there.
- [ ] **P5-12** The pre-call routine (reset → open two windows → sign in) takes under 2 minutes.

---

## Done means (from the plan)

- [ ] **D-01** A live demo runs end to end with no errors (P4-10 plus R-03 on the hosted version).
- [ ] **D-02** A 2-minute walkthrough video exists (P5-08).
- [ ] **D-03** The demo has been used on at least 5 sales calls. Log the dates: ___ ___ ___ ___ ___
