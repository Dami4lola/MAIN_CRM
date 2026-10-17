/**
 * Reference documents for the "Ask the job history" assistant.
 * All SOPs and warranty sheets are invented for the demo; the brands are fictional.
 * Site notes and past job notes are searched alongside these from the live data.
 */
export type ReferenceDoc = { id: string; kind: "SOP" | "Warranty"; title: string; body: string };

export const EQUIPMENT_MAKES = {
  furnace: { make: "Hearthline", models: ["HL-80", "HL-96", "HL-96V"] },
  ac: { make: "Coolridge", models: ["CR-24", "CR-36", "CR-48"] },
  waterHeater: { make: "Brookwell", models: ["BW-40G", "BW-50G", "BW-50T"] },
  panel: { make: "Ampstead", models: ["AP-100", "AP-200"] },
  rooftop: { make: "Skyvent", models: ["SV-5T", "SV-10T", "SV-15T"] },
  boiler: { make: "Hearthline", models: ["HB-200", "HB-400"] },
} as const;

export const REFERENCE_DOCS: ReferenceDoc[] = [
  {
    id: "sop-no-heat",
    kind: "SOP",
    title: "SOP-HV-01 No-heat call on a gas furnace",
    body: "Confirm thermostat call and filter condition first. Check the ignition sequence: inducer, pressure switch, igniter, gas valve, flame proving. A flame that lights then drops out after a few seconds is almost always a dirty flame sensor; clean with fine abrasive pad, replace if pitted. Never bypass a pressure switch. Log combustion readings on every repair.",
  },
  {
    id: "sop-ac-no-cool",
    kind: "SOP",
    title: "SOP-HV-02 AC not cooling",
    body: "Check breaker and disconnect, then condenser fan and compressor. Test run capacitor against its rating; replace if more than 10% low. Inspect contactor for pitting. Only add refrigerant after a leak search; record pounds added on the job card.",
  },
  {
    id: "sop-rtu-pm",
    kind: "SOP",
    title: "SOP-HV-05 Rooftop unit quarterly maintenance",
    body: "Lock out and tag out at the unit disconnect. Replace filters and inspect belts, replacing if glazed or cracked. Rinse condenser coil, clear condensate drain, test economizer actuator. Roof access at commercial sites requires the site contact to sign the access log.",
  },
  {
    id: "sop-water-heater",
    kind: "SOP",
    title: "SOP-PL-03 Water heater replacement",
    body: "Shut gas and water, drain tank. Check venting for proper draft and clearance. Install an expansion tank on closed systems. Fill before lighting. Leave the old unit's serial and age on the job card for warranty claims.",
  },
  {
    id: "sop-backflow",
    kind: "SOP",
    title: "SOP-PL-07 Backflow prevention test",
    body: "Annual test is required for commercial accounts. Notify the site contact before shutting water. Record readings for both check valves and the relief valve. File the certificate with the city within five business days.",
  },
  {
    id: "sop-emergency-lighting",
    kind: "SOP",
    title: "SOP-EL-04 Emergency lighting test",
    body: "Monthly 30-second functional test, annual 90-minute duration test. Replace batteries on any unit that fails duration. Sign and date the site log book. School sites must be tested outside instructional hours.",
  },
  {
    id: "warranty-hearthline",
    kind: "Warranty",
    title: "Hearthline furnace warranty sheet",
    body: "Hearthline HL-series furnaces: 10-year parts warranty when registered within 60 days of install, 20-year heat exchanger warranty. Igniters and flame sensors are covered for 5 years. Labour is not covered by the manufacturer; Northline service contracts cover labour for contract customers.",
  },
  {
    id: "warranty-coolridge",
    kind: "Warranty",
    title: "Coolridge air conditioner warranty sheet",
    body: "Coolridge CR-series condensers: 10-year compressor warranty, 5-year parts warranty. Capacitors and contactors are wear items and not covered after year 2. Warranty requires annual maintenance records.",
  },
  {
    id: "warranty-brookwell",
    kind: "Warranty",
    title: "Brookwell water heater warranty sheet",
    body: "Brookwell BW-series tanks: 6-year tank and parts warranty, 1-year labour from the installer. Anode rods should be inspected every 2 years; a depleted anode voids tank coverage if not replaced.",
  },
];
