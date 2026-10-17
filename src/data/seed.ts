import { SERVICES, type Service } from "./catalog";
import { addDays, fromISO, stamp, todayISO } from "./dates";
import { EQUIPMENT_MAKES } from "./docs";
import { composeMessage } from "./messages";
import { initials } from "./text";
import type { Client, Crew, CrewColor, CrmState, Equipment, Job, JobSource, JobStatus, Message, PartUsed, Priority, Site, Technician, Trade } from "./types";

/**
 * Demo data for "Northline Mechanical": 12 crews, ~400 homeowners, 3 commercial
 * accounts and six months of job history. Seeded so every reset is identical
 * (dates move with today, so the demo always has a live "today").
 */

function makeRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
  };
}

const COLORS: CrewColor[] = ["blue", "orange", "green", "purple", "teal", "rose"];

const CREW_DEFS: [name: string, code: string, trade: Trade][] = [
  ["HVAC North", "HN", "HVAC"],
  ["HVAC South", "HS", "HVAC"],
  ["HVAC East", "HE", "HVAC"],
  ["HVAC West", "HW", "HVAC"],
  ["HVAC Commercial", "HC", "HVAC"],
  ["Plumbing North", "PN", "Plumbing"],
  ["Plumbing South", "PS", "Plumbing"],
  ["Plumbing East", "PE", "Plumbing"],
  ["Plumbing Commercial", "PC", "Plumbing"],
  ["Electrical North", "EN", "Electrical"],
  ["Electrical South", "ES", "Electrical"],
  ["Electrical Commercial", "EC", "Electrical"],
];

const TECH_NAMES = [
  "Marcus Lee", "Sam Ortega", "Devon Kim", "Tony Reed", "Priya Natarajan", "Luis Romero",
  "Hannah Brooks", "Kwame Mensah", "Aisha Bello", "Ryan O'Neill", "Mei Chen", "Diego Alvarez",
  "Grace Okafor", "Ben Kowalski", "Tasha Grant", "Omar Haddad", "Liam Fraser", "Nina Petrov",
  "Chris Adeyemi", "Jake Morrison", "Sofia Rossi", "Ethan Park", "Zara Ahmed", "Caleb Turner",
];

const FIRST_NAMES = [
  "Olivia", "Daniel", "Sophia", "Noah", "Emma", "Liam", "Ava", "Lucas", "Mia", "Ethan", "Chloe", "Owen",
  "Isla", "Jack", "Amelia", "Leo", "Harper", "Henry", "Ella", "Mateo", "Zoe", "Samuel", "Nora", "Elijah",
  "Layla", "Wyatt", "Aria", "Caleb", "Grace", "Isaac", "Hazel", "Julian", "Ruby", "Adrian", "Stella", "Felix",
  "Leah", "Miles", "Ivy", "Theo", "Naomi", "Rowan", "Maya", "Victor", "Alice", "Andre", "Clara", "Kofi",
  "Fatima", "Raj", "Ana", "Tomás", "Yuki", "Ingrid", "Musa", "Elena", "Dmitri", "Amara", "Wei", "Rosa",
];

const LAST_NAMES = [
  "Martin", "Cho", "Brown", "Wilson", "Davis", "Parker", "Singh", "Thompson", "Nguyen", "Campbell", "Roy", "Tremblay",
  "Gagnon", "Li", "Anderson", "Taylor", "Moore", "White", "Clark", "Lewis", "Walker", "Hall", "Young", "King",
  "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Mitchell", "Patel", "Murphy", "Bennett", "Reyes",
  "Foster", "Hughes", "Coleman", "Sullivan", "Russell", "Ortiz", "Jenkins", "Perry", "Powell", "Long", "Barnes", "Ross",
  "Henderson", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bailey", "Okoye", "Ivanova", "Haddad", "Silva", "Kaur",
];

const STREETS = [
  "Maple Ave", "Cooper St", "Garden Lane", "Birch Rd", "King St", "Franklin Ave", "Oak Ridge Dr", "Willow Cres",
  "Cedar St", "Elm St", "Pine Hollow Rd", "Lakeview Blvd", "Queen St", "Church St", "Mill Rd", "Victoria Ave",
  "Highland Dr", "Ash Ct", "Spruce Way", "Orchard Lane", "Riverside Dr", "Park Pl", "Sunset Blvd", "Harbour Rd",
  "Meadow Lane", "Brookside Dr", "Hawthorn Ave", "Chestnut St", "Poplar Cres", "Forest Hill Rd",
];

const TOWNS = ["Millbrook", "Ridgeview", "Cedar Falls", "Lakeshore", "Northgate"];

const HOME_NOTES = [
  "Side gate code 4410.",
  "Has a dog. Call before entering the yard.",
  "Prefers text messages.",
  "Pays by e-transfer.",
  "Park on the street; the driveway is shared.",
  "Basement entrance at the back of the house.",
  "Call their daughter after each visit with a summary.",
  "Repeat customer. Asked for the same tech when possible.",
];

const JOB_NOTES = [
  "Customer will be home after 10.",
  "Bring shoe covers; new flooring.",
  "Second visit, part arrived.",
  "Customer asked for an estimate on a replacement while on site.",
  "Access through the garage.",
];

type AccountDef = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  address: string;
  responseHours: number;
  contract: string;
  notes: string;
  equipment: (keyof typeof EQUIPMENT_MAKES)[];
  sites: string[];
  siteNotes: string[];
};

const ACCOUNTS: AccountDef[] = [
  {
    id: "harbourview",
    name: "Harbourview Property Management",
    contactName: "Renee Walsh",
    email: "facilities@harbourview.example.com",
    address: "400 Harbour Rd, Suite 210, Lakeshore",
    responseHours: 4,
    contract: "Gold service contract",
    notes: "Tenant-occupied buildings. Call the building super 30 minutes before arrival.",
    equipment: ["boiler", "rooftop", "waterHeater", "panel"],
    sites: ["Harbour Point Apartments", "Bayside Towers", "The Wexford", "Lakeshore Commons", "Elm Court", "Granville Lofts", "Riverside Place", "Maple Terrace"],
    siteNotes: [
      "Mechanical room in the basement; key is with the super in unit 101.",
      "Roof access through the north stairwell. Sign the roof access log at the front desk.",
      "Boiler room shares a wall with the laundry room; tenants complain about noise before 9 AM.",
      "Visitor parking is limited to 2 hours; use the loading bay.",
    ],
  },
  {
    id: "millbrook-schools",
    name: "Millbrook District School Board",
    contactName: "Alan Pierce",
    email: "facilities@millbrooksb.example.org",
    address: "1 Education Way, Millbrook",
    responseHours: 8,
    contract: "Facilities maintenance agreement",
    notes: "Every tech needs a current background check on file. Work during class hours only with principal approval.",
    equipment: ["rooftop", "rooftop", "boiler", "panel"],
    sites: [
      "Millbrook Secondary School", "Cedar Falls Public School", "Ridgeview Elementary", "Lakeshore Middle School", "Northgate Public School",
      "St. Clair Elementary", "Westwood Secondary", "Pine Hollow Public School", "Board Office", "Transportation Depot",
    ],
    siteNotes: [
      "Check in at the main office and collect a visitor badge.",
      "Gym rooftop units are reached from the ladder in the custodian room.",
      "Custodian on site until 11 PM; evening work preferred.",
      "Portable classrooms have their own panels at the east fence.",
    ],
  },
  {
    id: "cornerstone",
    name: "Cornerstone Market",
    contactName: "Maya Shah",
    email: "ops@cornerstonemarket.example.com",
    address: "88 Commerce Dr, Ridgeview",
    responseHours: 6,
    contract: "Retail priority service",
    notes: "The store manager signs off on every visit. Avoid Saturday mornings.",
    equipment: ["rooftop", "waterHeater", "panel"],
    sites: ["Cornerstone Market Millbrook", "Cornerstone Market Ridgeview", "Cornerstone Market Lakeshore", "Cornerstone Market Cedar Falls", "Cornerstone Market Northgate"],
    siteNotes: [
      "Receiving door at the back; ring the bell and ask for the manager on duty.",
      "Rooftop units over the produce section must not be shut off for more than 30 minutes.",
      "Electrical room is behind the bakery.",
    ],
  },
];

const EQUIPMENT_TYPES: Record<keyof typeof EQUIPMENT_MAKES, string> = {
  furnace: "Furnace",
  ac: "Air conditioner",
  waterHeater: "Water heater",
  panel: "Electrical panel",
  rooftop: "Rooftop unit",
  boiler: "Boiler",
};

const TRADE_EQUIPMENT: Record<Trade, string[]> = {
  HVAC: ["Furnace", "Air conditioner", "Rooftop unit", "Boiler"],
  Plumbing: ["Water heater", "Boiler"],
  Electrical: ["Electrical panel"],
};

export function createSeed(): CrmState {
  const r = makeRandom(20261019);
  const today = todayISO();
  const phone = () => `(555) ${r.int(200, 989)}-${String(r.int(0, 9999)).padStart(4, "0")}`;
  const address = () => `${r.int(3, 980)} ${r.pick(STREETS)}, ${r.pick(TOWNS)}`;
  const equipment = (kind: keyof typeof EQUIPMENT_MAKES): Equipment => ({
    type: EQUIPMENT_TYPES[kind],
    make: EQUIPMENT_MAKES[kind].make,
    model: r.pick(EQUIPMENT_MAKES[kind].models),
    installed: r.int(2004, 2024),
  });

  // Commercial crews work a late shift so they can cover schools and stores after hours.
  const crews: Crew[] = CREW_DEFS.map(([name, code, trade], index) => ({
    id: code.toLowerCase(),
    name,
    code,
    trade,
    color: COLORS[index % COLORS.length],
    shift: name.endsWith("Commercial") ? [10, 19] : index % 2 === 0 ? [7, 16] : [8, 17],
  }));

  const technicians: Technician[] = TECH_NAMES.map((name, index) => {
    const crew = crews[Math.floor(index / 2)];
    const lead = index % 2 === 0;
    return {
      id: name.split(" ")[0].toLowerCase(),
      name,
      initials: initials(name),
      crewId: crew.id,
      color: crew.color,
      position: lead ? "Lead" : "Apprentice",
      phone: phone(),
      hourlyRate: lead ? r.int(40, 48) : r.int(25, 31),
    };
  });

  const clients: Client[] = [];
  const sites: Site[] = [];

  for (const account of ACCOUNTS) {
    clients.push({
      id: account.id,
      kind: "commercial",
      name: account.name,
      contactName: account.contactName,
      phone: phone(),
      email: account.email,
      address: account.address,
      notes: account.notes,
      sla: { responseHours: account.responseHours, contract: account.contract },
      createdAt: addDays(today, -r.int(400, 900)),
    });
    account.sites.forEach((name, index) => {
      sites.push({
        id: `${account.id}-${index + 1}`,
        clientId: account.id,
        name,
        address: address(),
        equipment: account.equipment.map(equipment),
        notes: r.pick(account.siteNotes),
      });
    });
  }

  const usedNames = new Set<string>();
  while (usedNames.size < 400) {
    const name = `${r.pick(FIRST_NAMES)} ${r.pick(LAST_NAMES)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const id = `c${usedNames.size}`;
    const home = address();
    const notes = r.chance(0.3) ? r.pick(HOME_NOTES) : "";
    clients.push({
      id,
      kind: "residential",
      name,
      contactName: name,
      phone: phone(),
      email: `${name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").replace(" ", ".")}@example.com`,
      address: home,
      notes,
      sla: null,
      createdAt: addDays(today, -r.int(190, 1100)),
    });
    sites.push({
      id: `${id}-home`,
      clientId: id,
      name: "Home",
      address: home,
      equipment: [equipment("furnace"), ...(r.chance(0.7) ? [equipment("ac")] : []), equipment("waterHeater"), equipment("panel")],
      notes,
    });
  }

  const commercial = clients.filter((client) => client.kind === "commercial");
  const residential = clients.filter((client) => client.kind === "residential");
  const sitesByClient = new Map<string, Site[]>();
  for (const site of sites) sitesByClient.set(site.clientId, [...(sitesByClient.get(site.clientId) ?? []), site]);

  const jobs: Job[] = [];
  let sequence = 10001;

  type Plan = { crew: Crew | null; trade: Trade; date: string; start: number; status: JobStatus; commercialShare: number };

  /** Adds a job that fits before the crew's shift ends, or returns null if nothing fits. */
  function addJob({ crew, trade, date, start, status, commercialShare }: Plan): Job | null {
    const maxHours = crew ? crew.shift[1] - start : 24;
    const isCommercial = r.chance(commercialShare);
    const client = isCommercial ? r.pick(commercial) : r.pick(residential);
    const site = r.pick(sitesByClient.get(client.id)!);
    const pool = SERVICES.filter((service) => service.trade === trade && service.duration <= maxHours && (service.market === "both" || service.market === client.kind));
    if (pool.length === 0) return null;
    const service: Service = r.pick(pool);
    // Work from today on was booked ahead, apart from early calls this morning.
    const bookedAhead = date > today || (date === today && start > 10);
    let priority: Priority = "Routine";
    if (service.kind === "repair" && !bookedAhead) {
      const urgency = r.next();
      if (urgency < (isCommercial ? 0.25 : 0.15)) priority = "Emergency";
      else if (urgency < (isCommercial ? 0.75 : 0.45)) priority = "Urgent";
    }
    const source: JobSource = isCommercial && service.kind === "maintenance" ? "Contract" : r.chance(0.45) ? "Online" : "Phone";

    let requestedAt: string;
    if (client.sla && priority !== "Routine") {
      // Most commercial calls land inside the SLA window; about 1 in 11 runs late.
      const lead = client.sla.responseHours * (r.chance(0.09) ? 1.05 + r.next() * 0.8 : 0.25 + r.next() * 0.7);
      requestedAt = stamp(date, start - lead);
    } else if (priority === "Emergency") {
      requestedAt = stamp(date, start - (1 + r.next() * 3));
    } else if (priority === "Urgent") {
      requestedAt = stamp(date, start - (14 + r.next() * 20));
    } else {
      requestedAt = stamp(addDays(date, -r.int(2, 12)), 8 + r.int(0, 20) / 2);
    }
    if (requestedAt > `${today}T07:00`) requestedAt = stamp(addDays(today, -r.int(1, 3)), 9 + r.int(0, 16) / 2);
    const requestedDay = requestedAt.slice(0, 10);

    const [low, high] = service.price;
    const amount = Math.round((low + r.next() * (high - low)) / 5) * 5;
    const quoted = status !== "Unassigned" && (status !== "Scheduled" || date <= today || r.chance(0.7));
    const takesDeposit = quoted && client.kind === "residential" && amount >= 1000;

    const job: Job = {
      id: `JB-${sequence++}`,
      title: service.title,
      trade,
      priority,
      source,
      clientId: client.id,
      siteId: site.id,
      address: site.address,
      requestedAt,
      date,
      time: stamp(date, start).slice(11),
      duration: service.duration,
      crewId: crew?.id ?? null,
      status,
      enRouteAt: null,
      arrivedAt: null,
      completedAt: null,
      firstTimeFix: null,
      closeOut: null,
      quote: { amount, sentAt: quoted ? requestedDay : null },
      deposit: { amount: takesDeposit ? Math.round(amount * 0.3) : 0, receivedAt: takesDeposit ? addDays(requestedDay, 1) : null },
      paidAt: null,
      notes: r.chance(0.15) ? r.pick(JOB_NOTES) : "",
    };

    if (status === "En route" || status === "On site" || status === "Completed") {
      const arrive = start + (r.int(0, 4) * 5) / 60;
      job.enRouteAt = stamp(date, arrive - r.int(15, 40) / 60);
      if (status !== "En route") job.arrivedAt = stamp(date, arrive);
      if (status === "Completed") {
        job.completedAt = stamp(date, arrive + service.duration * (0.8 + r.next() * 0.45));
        job.firstTimeFix = service.kind !== "repair" || r.chance(0.86);
        const unit = site.equipment.find((item) => TRADE_EQUIPMENT[trade].includes(item.type));
        const label = unit ? `${unit.make} ${unit.model} ${unit.type.toLowerCase()}` : "the unit";
        const parts: PartUsed[] = [];
        for (const partId of service.parts) {
          if (parts.length < 2 && r.chance(0.4)) parts.push({ partId, qty: partId === "refrigerant" ? r.int(1, 3) : 1 });
        }
        job.closeOut = {
          notes: r.pick(service.findings).replace("{equipment}", label) + (job.firstTimeFix ? "" : " Part on order; return visit needed."),
          parts,
          photos: [],
          signedBy: client.contactName,
          signature: null,
        };
        const paidOn = addDays(date, client.kind === "commercial" ? r.int(14, 30) : r.chance(0.75) ? 0 : r.int(2, 10));
        if (paidOn <= today && (paidOn < addDays(today, -21) || r.chance(0.85))) job.paidAt = paidOn;
      }
    }

    jobs.push(job);
    return job;
  }

  const commercialShare = (crew: Crew) => (crew.name.endsWith("Commercial") ? 0.7 : 0.08);
  // Half an hour of travel between jobs; a null job means the day is full.
  const nextStart = (start: number, job: Job | null) => (job ? Math.ceil((start + job.duration + 0.5) * 2) / 2 : 99);

  // Six months of completed work. Sundays off; a third of the crews cover Saturdays.
  for (let offset = 182; offset >= 1; offset--) {
    const date = addDays(today, -offset);
    const weekday = fromISO(date).getDay();
    if (weekday === 0) continue;
    crews.forEach((crew, index) => {
      if (weekday === 6 && index % 3 !== 0) return;
      const count = weekday === 6 ? 1 : r.pick([1, 1, 2, 2, 2]);
      let start = crew.shift[0];
      for (let n = 0; n < count && start < crew.shift[1] - 1; n++) {
        start = nextStart(start, addJob({ crew, trade: crew.trade, date, start, status: "Completed", commercialShare: commercialShare(crew) }));
      }
    });
  }

  // Today: every crew is mid-day so the board has something happening.
  const todayPatterns: JobStatus[][] = [
    ["On site", "Scheduled", "Scheduled"],
    ["Completed", "En route", "Scheduled"],
    ["Completed", "On site", "Scheduled"],
  ];
  crews.forEach((crew, index) => {
    let start = crew.shift[0];
    for (const status of todayPatterns[index % 3]) {
      if (start >= crew.shift[1] - 1) break;
      start = nextStart(start, addJob({ crew, trade: crew.trade, date: today, start, status, commercialShare: commercialShare(crew) }));
    }
  });

  // The next two weeks of booked work.
  for (let offset = 1; offset <= 14; offset++) {
    const date = addDays(today, offset);
    if (fromISO(date).getDay() === 0) continue;
    crews.forEach((crew) => {
      const count = r.pick([0, 1, 1, 2, 2, 3]);
      let start = crew.shift[0];
      for (let n = 0; n < count && start < crew.shift[1] - 1; n++) {
        start = nextStart(start, addJob({ crew, trade: crew.trade, date, start, status: "Scheduled", commercialShare: commercialShare(crew) }));
      }
    });
  }

  // Online requests that came in overnight and are waiting for a crew.
  const requests: [Trade, string, number][] = [
    ["HVAC", today, 15],
    ["Plumbing", today, 14],
    ["Electrical", addDays(today, 1), 9],
    ["HVAC", addDays(today, 1), 10],
    ["Plumbing", addDays(today, 1), 13],
    ["Electrical", addDays(today, 2), 11],
  ];
  for (const [trade, date, start] of requests) {
    const job = addJob({ crew: null, trade, date, start, status: "Unassigned", commercialShare: 0 })!;
    job.source = "Online";
    job.requestedAt = stamp(addDays(today, -1), 15 + r.int(0, 10) / 2);
  }

  // A commercial no-heat call this morning; the 4-hour SLA clock is running.
  const bayside = sites.find((site) => site.id === "harbourview-2")!;
  Object.assign(addJob({ crew: null, trade: "HVAC", date: today, start: 10, status: "Unassigned", commercialShare: 1 })!, {
    title: "No-heat call",
    priority: "Emergency",
    source: "Phone",
    clientId: bayside.clientId,
    siteId: bayside.id,
    address: bayside.address,
    requestedAt: `${today}T06:50`,
    duration: 2,
    notes: "Super reports no heat on floors 6 to 12. Boiler showing a lockout code.",
  } satisfies Partial<Job>);

  // Texts already sent for today's and upcoming work, so the outbox has a history.
  const people = { clients, crews, technicians };
  const messages: Message[] = [];
  for (const job of jobs) {
    if (job.date < today) continue;
    if (job.source === "Online") messages.push(composeMessage("booking", job, people, job.requestedAt));
    const [requestedDay, requestedTime] = job.requestedAt.split("T");
    const [hour, minute] = requestedTime.split(":").map(Number);
    if (job.crewId) messages.push(composeMessage("booked", job, people, stamp(requestedDay, hour + minute / 60 + 0.5)));
    if (job.enRouteAt) messages.push(composeMessage("en-route", job, people, job.enRouteAt));
    if (job.completedAt) messages.push(composeMessage("done", job, people, job.completedAt));
  }
  messages.sort((a, b) => b.at.localeCompare(a.at));

  return { version: 3, crews, technicians, clients, sites, jobs, messages, audit: [], settings: { enRouteText: "on-my-way" }, currency: "USD" };
}
