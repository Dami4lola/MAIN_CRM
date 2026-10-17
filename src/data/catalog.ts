import type { Trade } from "./types";

export type Service = {
  id: string;
  title: string;
  trade: Trade;
  duration: number;
  price: [number, number];
  kind: "repair" | "maintenance" | "install";
  /** Who books it: homeowners, commercial accounts, or both. */
  market: "residential" | "commercial" | "both";
  parts: string[];
  /** Close-out note templates; {equipment} is replaced with the unit worked on. */
  findings: string[];
};

export type Part = { id: string; name: string; trade: Trade; price: number };

export const PARTS: Part[] = [
  { id: "flame-sensor", name: "Flame sensor", trade: "HVAC", price: 38 },
  { id: "igniter", name: "Hot surface igniter", trade: "HVAC", price: 64 },
  { id: "inducer-motor", name: "Inducer motor", trade: "HVAC", price: 285 },
  { id: "pressure-switch", name: "Pressure switch", trade: "HVAC", price: 72 },
  { id: "capacitor", name: "Run capacitor 45/5 µF", trade: "HVAC", price: 34 },
  { id: "contactor", name: "Contactor 40A", trade: "HVAC", price: 46 },
  { id: "filter-16x25", name: "Pleated filter 16x25", trade: "HVAC", price: 18 },
  { id: "thermostat", name: "Smart thermostat", trade: "HVAC", price: 189 },
  { id: "refrigerant", name: "Refrigerant R-410A (lb)", trade: "HVAC", price: 55 },
  { id: "belt", name: "Blower belt", trade: "HVAC", price: 22 },
  { id: "p-trap", name: "P-trap assembly", trade: "Plumbing", price: 24 },
  { id: "wax-ring", name: "Toilet wax ring", trade: "Plumbing", price: 9 },
  { id: "fill-valve", name: "Fill valve", trade: "Plumbing", price: 19 },
  { id: "cartridge", name: "Faucet cartridge", trade: "Plumbing", price: 42 },
  { id: "water-heater-50", name: "50 gal gas water heater", trade: "Plumbing", price: 1180 },
  { id: "anode-rod", name: "Anode rod", trade: "Plumbing", price: 48 },
  { id: "sump-pump", name: "1/2 HP sump pump", trade: "Plumbing", price: 265 },
  { id: "pex-fittings", name: "PEX fittings kit", trade: "Plumbing", price: 36 },
  { id: "backflow-kit", name: "Backflow repair kit", trade: "Plumbing", price: 88 },
  { id: "breaker-20", name: "20A breaker", trade: "Electrical", price: 28 },
  { id: "gfci", name: "GFCI receptacle", trade: "Electrical", price: 26 },
  { id: "panel-200", name: "200A panel", trade: "Electrical", price: 640 },
  { id: "led-troffer", name: "LED troffer 2x4", trade: "Electrical", price: 92 },
  { id: "ev-charger", name: "Level 2 EV charger", trade: "Electrical", price: 720 },
  { id: "emergency-battery", name: "Emergency light battery", trade: "Electrical", price: 31 },
  { id: "wire-12", name: "12/2 wire (25 ft)", trade: "Electrical", price: 39 },
];

export const SERVICES: Service[] = [
  {
    id: "furnace-repair", title: "Furnace repair", trade: "HVAC", duration: 2, price: [180, 520], kind: "repair", market: "both",
    parts: ["flame-sensor", "igniter", "inducer-motor", "pressure-switch", "filter-16x25"],
    findings: [
      "No heat call. Dirty flame sensor on {equipment}; cleaned and replaced. Unit cycling normally.",
      "Igniter cracked on {equipment}. Replaced igniter, verified ignition sequence over three cycles.",
      "Inducer motor noisy and slow to prove on {equipment}. Replaced inducer and pressure switch hose.",
      "Pressure switch failing to close on {equipment}. Cleared condensate trap, replaced switch.",
    ],
  },
  {
    id: "furnace-tuneup", title: "Furnace tune-up", trade: "HVAC", duration: 1.5, price: [129, 159], kind: "maintenance", market: "residential",
    parts: ["filter-16x25", "flame-sensor"],
    findings: [
      "Annual tune-up on {equipment}. Cleaned burners, checked heat exchanger, replaced filter. Filter was badly overdue.",
      "Tune-up on {equipment}. Combustion readings normal. Recommended humidifier pad replacement next visit.",
    ],
  },
  {
    id: "ac-repair", title: "AC repair", trade: "HVAC", duration: 2, price: [160, 480], kind: "repair", market: "both",
    parts: ["capacitor", "contactor", "refrigerant"],
    findings: [
      "Condenser not starting on {equipment}. Failed run capacitor replaced; amps within spec.",
      "Low suction pressure on {equipment}. Found leak at service valve, repaired and recharged.",
      "Contactor pitted on {equipment}. Replaced contactor, cleaned condenser coil.",
    ],
  },
  {
    id: "ac-install", title: "Central AC install", trade: "HVAC", duration: 6, price: [4200, 6800], kind: "install", market: "residential",
    parts: ["refrigerant", "thermostat"],
    findings: ["Installed new condenser and coil alongside {equipment}. Pressure tested, vacuumed and charged. Customer walked through thermostat."],
  },
  {
    id: "thermostat", title: "Thermostat replacement", trade: "HVAC", duration: 1, price: [240, 320], kind: "install", market: "residential",
    parts: ["thermostat"],
    findings: ["Replaced old thermostat with smart thermostat controlling {equipment}. Added C-wire at air handler."],
  },
  {
    id: "rtu-pm", title: "Rooftop unit maintenance", trade: "HVAC", duration: 3, price: [380, 620], kind: "maintenance", market: "commercial",
    parts: ["filter-16x25", "belt"],
    findings: [
      "Quarterly PM on {equipment}. Filters and belt replaced, coils rinsed, economizer checked.",
      "PM on {equipment}. Belt glazed, replaced. Noted minor rust on base pan; quote to follow.",
    ],
  },
  {
    id: "drain-clearing", title: "Drain clearing", trade: "Plumbing", duration: 1.5, price: [150, 290], kind: "repair", market: "both",
    parts: ["p-trap"],
    findings: [
      "Kitchen line slow. Augered 25 ft, heavy grease build-up cleared. Advised enzyme treatment.",
      "Main stack backup. Root intrusion at 40 ft; cleared. Recommend camera inspection.",
    ],
  },
  {
    id: "leak-repair", title: "Leak repair", trade: "Plumbing", duration: 1.5, price: [140, 380], kind: "repair", market: "both",
    parts: ["pex-fittings", "cartridge", "fill-valve", "wax-ring"],
    findings: [
      "Leak under vanity. Replaced compression fitting with PEX, no further drips after 15 min.",
      "Running toilet. Replaced fill valve and flapper.",
      "Dripping faucet. Replaced cartridge, cleaned aerator.",
    ],
  },
  {
    id: "water-heater", title: "Water heater replacement", trade: "Plumbing", duration: 4, price: [1850, 2600], kind: "install", market: "residential",
    parts: ["water-heater-50", "pex-fittings"],
    findings: ["Removed leaking {equipment}. Installed new 50 gal unit, new expansion tank, venting checked for draft."],
  },
  {
    id: "water-heater-service", title: "Water heater service", trade: "Plumbing", duration: 1.5, price: [160, 240], kind: "maintenance", market: "both",
    parts: ["anode-rod"],
    findings: ["Flushed {equipment}, sediment heavy. Anode rod 80% depleted; replaced."],
  },
  {
    id: "sump-pump", title: "Sump pump install", trade: "Plumbing", duration: 3, price: [620, 940], kind: "install", market: "residential",
    parts: ["sump-pump"],
    findings: ["Replaced seized sump pump with new 1/2 HP unit and check valve. Float tested."],
  },
  {
    id: "backflow-test", title: "Backflow test", trade: "Plumbing", duration: 1, price: [120, 180], kind: "maintenance", market: "commercial",
    parts: ["backflow-kit"],
    findings: ["Annual backflow test passed. Certificate filed with the city.", "Backflow test failed on first check valve; rebuilt and retested, passed."],
  },
  {
    id: "circuit-repair", title: "Outlet and circuit repair", trade: "Electrical", duration: 1.5, price: [140, 320], kind: "repair", market: "both",
    parts: ["breaker-20", "gfci", "wire-12"],
    findings: [
      "Tripping breaker in kitchen. Found shared neutral; separated circuits and replaced 20A breaker.",
      "Dead outlets in bathroom. Tripped GFCI upstream was failing; replaced.",
    ],
  },
  {
    id: "panel-upgrade", title: "Panel upgrade", trade: "Electrical", duration: 6, price: [2400, 3800], kind: "install", market: "residential",
    parts: ["panel-200", "breaker-20"],
    findings: ["Replaced 100A {equipment} with 200A panel. Utility disconnect coordinated, inspection booked."],
  },
  {
    id: "ev-charger", title: "EV charger install", trade: "Electrical", duration: 4, price: [1100, 1700], kind: "install", market: "residential",
    parts: ["ev-charger", "wire-12"],
    findings: ["Installed Level 2 charger in garage on new 50A circuit from {equipment}. Load calc on file."],
  },
  {
    id: "lighting-retrofit", title: "LED lighting retrofit", trade: "Electrical", duration: 4, price: [1400, 3200], kind: "install", market: "commercial",
    parts: ["led-troffer"],
    findings: ["Retrofitted fixtures to LED troffers. Old ballasts removed and recycled."],
  },
  {
    id: "emergency-lighting", title: "Emergency lighting test", trade: "Electrical", duration: 2, price: [220, 380], kind: "maintenance", market: "commercial",
    parts: ["emergency-battery"],
    findings: ["Monthly emergency lighting test. Two units failed duration test; batteries replaced.", "Emergency lighting test passed on all units. Log book signed."],
  },
];

export function serviceById(id: string) {
  return SERVICES.find((service) => service.id === id);
}

export function partById(id: string) {
  return PARTS.find((part) => part.id === id);
}
