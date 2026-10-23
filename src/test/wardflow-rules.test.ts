import { describe, expect, it } from "vitest";
import {
  addDays, approveDischarge, completeDischarge, correctTemp, freeBeds, isEligible, markVisit, mortality, recordDeath,
  recordTemp, registerPatient, validateTemp, type Patient, type WardData,
} from "@/lib/wardflow/logic";

const T = "2026-10-23";
const P = (id: string, bed: number | null, status: Patient["status"] = "active"): Patient =>
  ({ id, name: id, age: 30, gender: "M", bed, admissionDate: addDays(T, -5), status });
const base = (): WardData => ({ patients: [P("WF-0001", 1)], readings: [], corrections: [], visits: [] });
const withTemps = (vals: (number | null)[]): WardData => {
  const d = base();
  vals.forEach((v, i) => { if (v !== null) d.readings.push({ id: `r${i}`, patientId: "WF-0001", date: addDays(T, -i), value: v, recordedAt: "" }); });
  return d;
};

describe("WardFlow rules", () => {
  it("rejects readings outside 34–42°C and asks confirmation outside 35–41°C", () => {
    expect(validateTemp(33.9).ok).toBe(false);
    expect(validateTemp(42.1).ok).toBe(false);
    expect(validateTemp(34.5)).toEqual({ ok: true, needsConfirm: true });
    expect(validateTemp(41.5)).toEqual({ ok: true, needsConfirm: true });
    expect(validateTemp(37)).toEqual({ ok: true, needsConfirm: false });
  });
  it("allows one reading per day and only nurses record", () => {
    const r = recordTemp(base(), "nurse", "WF-0001", 37, T, "");
    expect(r.ok).toBe(true);
    if (r.ok) expect(recordTemp(r.data, "nurse", "WF-0001", 37, T, "").ok).toBe(false);
    expect(recordTemp(base(), "doctor", "WF-0001", 37, T, "").ok).toBe(false);
  });
  it("corrections need a reason and only apply to today", () => {
    const d = withTemps([37]);
    expect(correctTemp(d, "nurse", "WF-0001", T, 37.2, "", T, "").ok).toBe(false);
    expect(correctTemp(d, "nurse", "WF-0001", addDays(T, -1), 37.2, "typo", T, "").ok).toBe(false);
    const r = correctTemp(d, "nurse", "WF-0001", T, 37.2, "typo", T, "");
    expect(r.ok && r.data.corrections[0]).toMatchObject({ oldValue: 37, newValue: 37.2 });
  });
  it("visit requires today's reading", () => {
    expect(markVisit(base(), "doctor", "WF-0001", "", T, "").ok).toBe(false);
  });
  it("eligibility needs 3 fever-free recorded days incl. today plus today's visit", () => {
    const visit = (d: WardData) => { const r = markVisit(d, "doctor", "WF-0001", "", T, ""); return r.ok ? r.data : d; };
    expect(isEligible(visit(withTemps([37, 37, 37])), base().patients[0]!, T)).toBe(true);
    expect(isEligible(withTemps([37, 37, 37]), base().patients[0]!, T)).toBe(false); // no visit
    expect(isEligible(visit(withTemps([37, 38, 37])), base().patients[0]!, T)).toBe(false); // 38 is fever
    expect(isEligible(visit(withTemps([37, null, 37])), base().patients[0]!, T)).toBe(false); // missing day
  });
  it("approval keeps the bed; admin completion frees it", () => {
    let d = withTemps([37, 37, 37]);
    const v = markVisit(d, "doctor", "WF-0001", "", T, ""); if (v.ok) d = v.data;
    const a = approveDischarge(d, "doctor", "WF-0001", T, ""); expect(a.ok).toBe(true); if (a.ok) d = a.data;
    expect(freeBeds(d.patients)).not.toContain(1);
    expect(completeDischarge(d, "doctor", "WF-0001", "").ok).toBe(false);
    const c = completeDischarge(d, "admin", "WF-0001", ""); expect(c.ok).toBe(true);
    if (c.ok) expect(freeBeds(c.data.patients)).toContain(1);
  });
  it("death closes case and releases bed", () => {
    const r = recordDeath(base(), "doctor", "WF-0001", "", "");
    expect(r.ok && r.data.patients[0]).toMatchObject({ status: "deceased", bed: null });
  });
  it("never assigns an occupied bed and caps at 74", () => {
    expect(registerPatient(base(), "admin", { name: "X", age: 30, gender: "F", bed: 1 }, T).ok).toBe(false);
    const full: WardData = { ...base(), patients: Array.from({ length: 74 }, (_, i) => P(`WF-${i + 1}`, i + 1)) };
    expect(registerPatient(full, "admin", { name: "X", age: 30, gender: "F", bed: 1 }, T).ok).toBe(false);
  });
  it("mortality = deaths / closed × 100, warns above 15%", () => {
    const ps = [P("a", null, "deceased"), P("b", null, "discharged"), P("c", null, "discharged"), P("d", null, "discharged"), P("e", 2)];
    const m = mortality(ps);
    expect(m.rate).toBe(25);
    expect(m.exceeds).toBe(true);
    expect(m.limited).toBe(true);
  });
});
