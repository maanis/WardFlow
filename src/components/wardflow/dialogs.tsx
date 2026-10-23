import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWard } from "@/lib/wardflow/store";
import {
  approveDischarge, can, correctTemp, feverFreeStreak, freeBeds, isEligible, isFever, markVisit, recordDeath, recordTemp,
  registerPatient, todayReading, validateTemp, visitedOn, FEVER_FREE_DAYS_REQUIRED, type Patient,
} from "@/lib/wardflow/logic";
import { Pill, StatusPill, fmtDate, fmtTime } from "./ui";

const nowIso = () => new Date().toISOString();
const selectCls = "h-9 w-full rounded-md border border-input bg-card px-2 text-sm";

export function TempDialog({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const { data, role, today, run } = useWard();
  const existing = patient ? todayReading(data, patient.id, today) : undefined;
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState("");
  const close = () => { setValue(""); setReason(""); setConfirming(false); setErr(""); onClose(); };

  const submit = () => {
    if (!patient) return;
    const v = parseFloat(value);
    const check = validateTemp(v);
    if (!check.ok) return setErr(check.error);
    if (existing && !reason.trim()) return setErr("A reason is required for corrections.");
    if (check.needsConfirm && !confirming) { setConfirming(true); setErr(""); return; }
    const ok = run((d) => existing
      ? correctTemp(d, role, patient.id, today, v, reason, today, nowIso())
      : recordTemp(d, role, patient.id, v, today, nowIso()));
    if (ok) close();
  };

  return (
    <Dialog open={!!patient} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Correct today's reading" : "Record today's temperature"}</DialogTitle>
          <DialogDescription>{patient?.name} · {patient?.id} · Bed {patient?.bed}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {existing && <p className="text-sm text-muted-foreground">Current reading: <b className="text-foreground">{existing.value.toFixed(1)}°C</b></p>}
          <div className="space-y-1">
            <Label htmlFor="t">Temperature (°C)</Label>
            <Input id="t" type="number" step="0.1" autoFocus value={value} onChange={(e) => { setValue(e.target.value); setConfirming(false); }} placeholder="e.g. 36.8" />
          </div>
          {existing && (
            <div className="space-y-1">
              <Label htmlFor="r">Reason for correction *</Label>
              <Textarea id="r" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}
          {confirming && (
            <div className="flex gap-2 rounded-md border border-warning/30 bg-warning-soft p-2 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Unusual reading ({value}°C). Confirm it is correct.
            </div>
          )}
          {err && <p className="text-sm text-danger">{err}</p>}
          <p className="text-xs text-muted-foreground">Demo thresholds: fever ≥ 38°C; accepted range 34–42°C.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={submit}>{confirming ? "Confirm reading" : existing ? "Save correction" : "Record"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PatientDialog({ patientId, onClose }: { patientId: string | null; onClose: () => void }) {
  const { data, role, today, run } = useWard();
  const p = data.patients.find((x) => x.id === patientId) ?? null;
  const [note, setNote] = useState("");
  const [deathMode, setDeathMode] = useState(false);
  const close = () => { setNote(""); setDeathMode(false); onClose(); };
  if (!p) return null;

  const readings = data.readings.filter((r) => r.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  const visits = data.visits.filter((v) => v.patientId === p.id).sort((a, b) => b.at.localeCompare(a.at));
  const corrections = data.corrections.filter((c) => c.patientId === p.id);
  const streak = feverFreeStreak(data, p.id, today);
  const eligible = isEligible(data, p, today);
  const hasTemp = !!todayReading(data, p.id, today);
  const visited = visitedOn(data, p.id, today);
  const isDoctor = can(role, "markVisit");

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{p.name} <StatusPill s={p.status} /></DialogTitle>
          <DialogDescription>{p.id} · {p.age}{p.gender} · Bed {p.bed ?? "—"} · Admitted {fmtDate(p.admissionDate)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Fever-free streak</div><b>{streak} / {FEVER_FREE_DAYS_REQUIRED} days</b></div>
          <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Today's visit</div><b>{visited ? "Done" : "Pending"}</b></div>
          <div className="rounded-md border p-2"><div className="text-xs text-muted-foreground">Discharge</div>
            <b>{p.status === "discharge_approved" ? "Approved" : eligible ? "Eligible" : "Not eligible"}</b></div>
        </div>

        {isDoctor && p.status === "active" && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            {!visited ? (
              <>
                <Label htmlFor="note">Treatment note (optional)</Label>
                <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={!hasTemp} />
                {!hasTemp && <p className="text-xs text-warning">Today's temperature must be recorded before the visit.</p>}
              </>
            ) : <p className="text-sm text-muted-foreground">Today's visit is recorded.</p>}
            <div className="flex flex-wrap gap-2">
              {!visited && <Button size="sm" disabled={!hasTemp} onClick={() => run((d) => markVisit(d, role, p.id, note, today, nowIso())) && setNote("")}>Mark visit</Button>}
              <Button size="sm" variant="outline" disabled={!eligible} onClick={() => run((d) => approveDischarge(d, role, p.id, today, nowIso()))}>Approve discharge</Button>
              <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => setDeathMode(true)}>Record death</Button>
            </div>
          </div>
        )}
        {isDoctor && p.status === "discharge_approved" && (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
            Awaiting admin to complete discharge.
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeathMode(true)}>Record death</Button>
          </div>
        )}
        {deathMode && (
          <div className="space-y-2 rounded-md border border-danger/30 bg-danger-soft p-3">
            <p className="text-sm font-medium text-danger">Record death and close this case? The bed will be released.</p>
            <Textarea rows={2} placeholder="Cause / note" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => run((d) => recordDeath(d, role, p.id, note, nowIso())) && close()}>Confirm</Button>
              <Button size="sm" variant="outline" onClick={() => setDeathMode(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Temperature history</h3>
            <ul className="divide-y rounded-md border text-sm">
              {readings.length === 0 && <li className="p-2 text-muted-foreground">No readings.</li>}
              {readings.map((r) => (
                <li key={r.id} className="flex justify-between px-2 py-1.5">
                  <span>{fmtDate(r.date)}{r.date === today && " (today)"}</span>
                  <Pill tone={isFever(r.value) ? "danger" : "success"}>{r.value.toFixed(1)}°C</Pill>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Doctor visits</h3>
              <ul className="divide-y rounded-md border text-sm">
                {visits.length === 0 && <li className="p-2 text-muted-foreground">No visits.</li>}
                {visits.map((v) => <li key={v.id} className="px-2 py-1.5"><div className="text-xs text-muted-foreground">{fmtTime(v.at)}</div>{v.note || <i className="text-muted-foreground">No note</i>}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Corrections</h3>
              <ul className="divide-y rounded-md border text-sm">
                {corrections.length === 0 && <li className="p-2 text-muted-foreground">None.</li>}
                {corrections.map((c) => <li key={c.id} className="px-2 py-1.5"><div className="text-xs text-muted-foreground">{fmtTime(c.at)}</div>{c.oldValue.toFixed(1)} → {c.newValue.toFixed(1)}°C · {c.reason}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RegisterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, role, today, run } = useWard();
  const beds = freeBeds(data.patients);
  const [form, setForm] = useState({ name: "", age: "", gender: "M" as Patient["gender"], bed: "" });
  const [err, setErr] = useState("");
  const close = () => { setForm({ name: "", age: "", gender: "M", bed: "" }); setErr(""); onClose(); };
  const submit = () => {
    if (!form.name.trim() || !form.age) return setErr("Name and age are required.");
    const bed = Number(form.bed || beds[0]);
    if (run((d) => registerPatient(d, role, { name: form.name, age: Number(form.age), gender: form.gender, bed }, today))) close();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Register patient</DialogTitle><DialogDescription>{beds.length} beds available</DialogDescription></DialogHeader>
        {beds.length === 0 ? <p className="text-sm text-danger">All beds are occupied. Admission is not possible.</p> : (
          <div className="space-y-3">
            <div className="space-y-1"><Label>Full name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Age *</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div className="space-y-1"><Label>Gender</Label>
                <select className={selectCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Patient["gender"] })}>
                  <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
                </select></div>
            </div>
            <div className="space-y-1"><Label>Bed</Label>
              <select className={selectCls} value={form.bed || beds[0]} onChange={(e) => setForm({ ...form, bed: e.target.value })}>
                {beds.map((b) => <option key={b} value={b}>Bed {b}</option>)}
              </select></div>
            {err && <p className="text-sm text-danger">{err}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={submit} disabled={beds.length === 0}>Register</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
