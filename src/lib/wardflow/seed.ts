import { addDays, type Patient, type Reading, type Visit, type WardData } from "./logic";

const FIRST = ["Aarav", "Meera", "Rohan", "Isha", "Kabir", "Ananya", "Vikram", "Diya", "Arjun", "Sara", "Nikhil", "Priya", "Dev", "Tara", "Rahul", "Neha", "Omar", "Leela", "Sameer", "Kavya"];
const LAST = ["Mehta", "Rao", "Sharma", "Iyer", "Khan", "Das", "Nair", "Gupta", "Pillai", "Bose", "Verma", "Joshi"];

/** Deterministic fictional demo data relative to `today`. Call lazily, never at module scope. */
export function makeSeed(today: string): WardData {
  const patients: Patient[] = [];
  const readings: Reading[] = [];
  const visits: Visit[] = [];
  let n = 0;
  const pid = () => `WF-${String(++n).padStart(4, "0")}`;
  const name = (i: number) => `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;

  // Closed cases: 16 recoveries, 2 deaths
  for (let i = 0; i < 18; i++) {
    const dead = i % 9 === 4;
    patients.push({ id: pid(), name: name(i + 40), age: 22 + ((i * 13) % 55), gender: i % 2 ? "F" : "M", bed: null,
      admissionDate: addDays(today, -20 - i), status: dead ? "deceased" : "discharged",
      closedAt: addDays(today, -3 - (i % 10)) + "T10:00:00", closeNote: dead ? "Respiratory failure" : undefined });
  }

  // Active: 38 patients in beds 1..38
  for (let i = 0; i < 38; i++) {
    const id = pid();
    const stay = 1 + (i % 9);
    const admission = addDays(today, -stay);
    patients.push({ id, name: name(i), age: 19 + ((i * 17) % 60), gender: i % 3 === 0 ? "F" : "M", bed: i + 1, admissionDate: admission, status: "active" });
    const feverish = i % 5 === 1;
    for (let k = stay; k >= 1; k--) {
      const d = addDays(today, -k);
      const fever = feverish ? k <= 3 : k > 4 && i % 4 === 0;
      const v = fever ? 38.2 + ((i + k) % 8) / 10 : 36.4 + ((i * 3 + k) % 9) / 10;
      readings.push({ id: `r${id}${k}`, patientId: id, date: d, value: Math.round(v * 10) / 10, recordedAt: d + "T08:30:00" });
    }
    // ~60% have today's reading
    if (i % 5 !== 0 && i % 7 !== 3) {
      const v = feverish ? 38.4 : 36.5 + (i % 7) / 10;
      readings.push({ id: `r${id}0`, patientId: id, date: today, value: Math.round(v * 10) / 10, recordedAt: today + "T08:15:00" });
      if (i % 3 === 0) visits.push({ id: `v${id}`, patientId: id, date: today, note: "Stable, continue observation.", at: today + "T11:00:00" });
    }
  }
  return { patients, readings, corrections: [], visits };
}
