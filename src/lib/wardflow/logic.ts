// Pure WardFlow rules. Thresholds are demo assumptions, not medical advice.
export const CAPACITY = 74;
export const FEVER_C = 38;
export const MIN_C = 34;
export const MAX_C = 42;
export const CONFIRM_LOW_C = 35;
export const CONFIRM_HIGH_C = 41;
export const MORTALITY_THRESHOLD = 15;
export const MIN_CASES_FOR_RELIABLE_RATE = 20;
export const FEVER_FREE_DAYS_REQUIRED = 3;

export type Role = "nurse" | "doctor" | "admin" | "head";
export type PatientStatus = "active" | "discharge_approved" | "discharged" | "deceased";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "O";
  bed: number | null;
  admissionDate: string;
  status: PatientStatus;
  approvedAt?: string;
  closedAt?: string;
  closeNote?: string;
}
export interface Reading { id: string; patientId: string; date: string; value: number; recordedAt: string }
export interface Correction { id: string; patientId: string; date: string; oldValue: number; newValue: number; reason: string; at: string }
export interface Visit { id: string; patientId: string; date: string; note: string; at: string }
export interface WardData { patients: Patient[]; readings: Reading[]; corrections: Correction[]; visits: Visit[] }

export const ROLE_LABEL: Record<Role, string> = { nurse: "Nurse", doctor: "Doctor", admin: "Admin", head: "Head Doctor" };

export type Action = "recordTemp" | "correctTemp" | "markVisit" | "approveDischarge" | "recordDeath" | "registerPatient" | "completeDischarge";
const PERMS: Record<Action, Role[]> = {
  recordTemp: ["nurse"], correctTemp: ["nurse"], markVisit: ["doctor"], approveDischarge: ["doctor"],
  recordDeath: ["doctor"], registerPatient: ["admin"], completeDischarge: ["admin"],
};
export const can = (role: Role, action: Action) => PERMS[action].includes(role);

export function dayKey(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

export const isFever = (v: number) => v >= FEVER_C;
export const occupiesBed = (p: Patient) => p.status === "active" || p.status === "discharge_approved";
export const isClosed = (p: Patient) => p.status === "discharged" || p.status === "deceased";

export function validateTemp(v: number): { ok: false; error: string } | { ok: true; needsConfirm: boolean } {
  if (!Number.isFinite(v)) return { ok: false, error: "Enter a valid temperature." };
  if (v < MIN_C || v > MAX_C) return { ok: false, error: `Reading must be between ${MIN_C}°C and ${MAX_C}°C.` };
  return { ok: true, needsConfirm: v < CONFIRM_LOW_C || v > CONFIRM_HIGH_C };
}

export const readingsFor = (data: WardData, pid: string, date: string) =>
  data.readings.filter((r) => r.patientId === pid && r.date === date);
export const todayReading = (data: WardData, pid: string, today: string) => readingsFor(data, pid, today)[0];
export const visitedOn = (data: WardData, pid: string, date: string) =>
  data.visits.some((v) => v.patientId === pid && v.date === date);

/** Consecutive days ending today with at least one reading and all readings below fever. */
export function feverFreeStreak(data: WardData, pid: string, today: string): number {
  let n = 0, d = today;
  for (let i = 0; i < 400; i++) {
    const rs = readingsFor(data, pid, d);
    if (rs.length === 0 || rs.some((r) => isFever(r.value))) break;
    n++; d = addDays(d, -1);
  }
  return n;
}

export function isEligible(data: WardData, p: Patient, today: string): boolean {
  return p.status === "active" && feverFreeStreak(data, p.id, today) >= FEVER_FREE_DAYS_REQUIRED && visitedOn(data, p.id, today);
}

export function freeBeds(patients: Patient[]): number[] {
  const used = new Set(patients.filter(occupiesBed).map((p) => p.bed));
  const out: number[] = [];
  for (let b = 1; b <= CAPACITY; b++) if (!used.has(b)) out.push(b);
  return out;
}

export function mortality(patients: Patient[]) {
  const deaths = patients.filter((p) => p.status === "deceased").length;
  const recoveries = patients.filter((p) => p.status === "discharged").length;
  const closed = deaths + recoveries;
  const rate = closed === 0 ? 0 : (deaths / closed) * 100;
  return { deaths, recoveries, closed, rate, exceeds: rate > MORTALITY_THRESHOLD, limited: closed < MIN_CASES_FOR_RELIABLE_RATE };
}

export function nextPatientId(patients: Patient[]): string {
  const max = patients.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, "")) || 0), 0);
  return `WF-${String(max + 1).padStart(4, "0")}`;
}

// ---------- mutations (pure; return new data or error) ----------
type Result = { ok: true; data: WardData; message: string } | { ok: false; error: string };
const uid = () => Math.random().toString(36).slice(2, 10);
const deny = (role: Role): Result => ({ ok: false, error: `${ROLE_LABEL[role]} is not permitted to do this.` });
const findP = (d: WardData, id: string) => d.patients.find((p) => p.id === id);

export function recordTemp(d: WardData, role: Role, pid: string, value: number, today: string, now: string): Result {
  if (!can(role, "recordTemp")) return deny(role);
  const p = findP(d, pid);
  if (!p || !occupiesBed(p)) return { ok: false, error: "Patient is not active." };
  const v = validateTemp(value);
  if (!v.ok) return v;
  if (todayReading(d, pid, today)) return { ok: false, error: "Today's reading already exists. Use correction instead." };
  return { ok: true, message: `Recorded ${value.toFixed(1)}°C for ${p.name}.`,
    data: { ...d, readings: [...d.readings, { id: uid(), patientId: pid, date: today, value, recordedAt: now }] } };
}

export function correctTemp(d: WardData, role: Role, pid: string, date: string, value: number, reason: string, today: string, now: string): Result {
  if (!can(role, "correctTemp")) return deny(role);
  if (date !== today) return { ok: false, error: "Only today's reading can be corrected." };
  const p = findP(d, pid);
  if (!p || !occupiesBed(p)) return { ok: false, error: "Patient is not active." };
  if (!reason.trim()) return { ok: false, error: "A reason is required for corrections." };
  const v = validateTemp(value);
  if (!v.ok) return v;
  const r = todayReading(d, pid, today);
  if (!r) return { ok: false, error: "No reading recorded today." };
  return { ok: true, message: `Corrected reading for ${p.name}.`, data: {
    ...d,
    readings: d.readings.map((x) => (x.id === r.id ? { ...x, value } : x)),
    corrections: [...d.corrections, { id: uid(), patientId: pid, date, oldValue: r.value, newValue: value, reason: reason.trim(), at: now }],
  } };
}

export function markVisit(d: WardData, role: Role, pid: string, note: string, today: string, now: string): Result {
  if (!can(role, "markVisit")) return deny(role);
  const p = findP(d, pid);
  if (!p || p.status !== "active") return { ok: false, error: "Patient is not active." };
  if (!todayReading(d, pid, today)) return { ok: false, error: "Today's temperature must be recorded before the visit." };
  if (visitedOn(d, pid, today)) return { ok: false, error: "Visit already recorded today." };
  return { ok: true, message: `Visit recorded for ${p.name}.`,
    data: { ...d, visits: [...d.visits, { id: uid(), patientId: pid, date: today, note: note.trim(), at: now }] } };
}

export function approveDischarge(d: WardData, role: Role, pid: string, today: string, now: string): Result {
  if (!can(role, "approveDischarge")) return deny(role);
  const p = findP(d, pid);
  if (!p) return { ok: false, error: "Patient not found." };
  if (!isEligible(d, p, today)) return { ok: false, error: "Patient does not meet discharge criteria." };
  return { ok: true, message: `Discharge approved for ${p.name}. Awaiting admin.`,
    data: { ...d, patients: d.patients.map((x) => (x.id === pid ? { ...x, status: "discharge_approved", approvedAt: now } : x)) } };
}

export function completeDischarge(d: WardData, role: Role, pid: string, now: string): Result {
  if (!can(role, "completeDischarge")) return deny(role);
  const p = findP(d, pid);
  if (!p || p.status !== "discharge_approved") return { ok: false, error: "Discharge has not been approved by a doctor." };
  return { ok: true, message: `${p.name} discharged. Bed ${p.bed} is now free.`,
    data: { ...d, patients: d.patients.map((x) => (x.id === pid ? { ...x, status: "discharged", bed: null, closedAt: now } : x)) } };
}

export function recordDeath(d: WardData, role: Role, pid: string, note: string, now: string): Result {
  if (!can(role, "recordDeath")) return deny(role);
  const p = findP(d, pid);
  if (!p || !occupiesBed(p)) return { ok: false, error: "Patient is not active." };
  return { ok: true, message: `Death recorded for ${p.name}. Case closed.`,
    data: { ...d, patients: d.patients.map((x) => (x.id === pid ? { ...x, status: "deceased", bed: null, closedAt: now, closeNote: note.trim() } : x)) } };
}

export function registerPatient(d: WardData, role: Role, input: { name: string; age: number; gender: Patient["gender"]; bed: number }, today: string): Result {
  if (!can(role, "registerPatient")) return deny(role);
  if (!input.name.trim()) return { ok: false, error: "Name is required." };
  if (!Number.isInteger(input.age) || input.age < 0 || input.age > 120) return { ok: false, error: "Enter a valid age (0–120)." };
  const free = freeBeds(d.patients);
  if (free.length === 0) return { ok: false, error: `All ${CAPACITY} beds are occupied.` };
  if (!free.includes(input.bed)) return { ok: false, error: `Bed ${input.bed} is not available.` };
  const id = nextPatientId(d.patients);
  return { ok: true, message: `Registered ${input.name.trim()} (${id}) in bed ${input.bed}.`, data: { ...d,
    patients: [...d.patients, { id, name: input.name.trim(), age: input.age, gender: input.gender, bed: input.bed, admissionDate: today, status: "active" }] } };
}
