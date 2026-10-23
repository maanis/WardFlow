import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWard } from "@/lib/wardflow/store";
import {
  CAPACITY, MORTALITY_THRESHOLD, ROLE_LABEL, feverFreeStreak, isEligible, isFever, mortality, occupiesBed, todayReading, visitedOn,
  completeDischarge, type Patient,
} from "@/lib/wardflow/logic";
import { PageHeader, Panel, Pill, Stat, StatusPill, Table, Td, TempPill, fmtDate } from "@/components/wardflow/ui";
import { PatientDialog, RegisterDialog, TempDialog } from "@/components/wardflow/dialogs";
import { MortalitySummary, ClosedCasesTable } from "./reports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WardFlow" },
      { name: "description", content: "Role-based ward dashboard: pending readings, fever alerts, beds and discharges." },
      { property: "og:title", content: "Dashboard — WardFlow" },
      { property: "og:description", content: "Role-based ward dashboard for a 74-bed quarantine centre." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useWard();
  return (
    <>
      <PageHeader title={`${ROLE_LABEL[role]} dashboard`} sub="Live overview for today" />
      {role === "nurse" && <NurseDash />}
      {role === "doctor" && <DoctorDash />}
      {role === "admin" && <AdminDash />}
      {role === "head" && <HeadDash />}
    </>
  );
}

function NurseDash() {
  const { data, today } = useWard();
  const [temp, setTemp] = useState<Patient | null>(null);
  const active = data.patients.filter(occupiesBed);
  const pending = active.filter((p) => !todayReading(data, p.id, today));
  const done = active.length - pending.length;
  const fevers = active.filter((p) => { const r = todayReading(data, p.id, today); return r && isFever(r.value); });
  const sorted = [...pending, ...active.filter((p) => !pending.includes(p))];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pending readings" value={pending.length} tone={pending.length ? "warning" : "success"} />
        <Stat label="Completed today" value={done} hint={`of ${active.length} active`} />
        <Stat label="Fever alerts" value={fevers.length} tone={fevers.length ? "danger" : undefined} />
        <Stat label="Active patients" value={active.length} />
      </div>
      <Panel title="Today's patients" action={<Link to="/temperatures" className="text-sm text-primary">Open temperatures</Link>}>
        <Table head={["Bed", "Patient", "Today", "Action"]} empty={!sorted.length}>
          {sorted.map((p) => {
            const r = todayReading(data, p.id, today);
            return (
              <tr key={p.id} className={!r ? "bg-warning-soft/40" : ""}>
                <Td className="tabular-nums">{p.bed}</Td><Td><b>{p.name}</b> <span className="text-muted-foreground">{p.id}</span></Td>
                <Td><TempPill data={data} p={p} today={today} /></Td>
                <Td><Button size="sm" variant={r ? "outline" : "default"} onClick={() => setTemp(p)}>{r ? "Correct" : "Record"}</Button></Td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <TempDialog patient={temp} onClose={() => setTemp(null)} />
    </div>
  );
}

function DoctorDash() {
  const { data, today } = useWard();
  const [open, setOpen] = useState<string | null>(null);
  const active = data.patients.filter((p) => p.status === "active");
  const awaitingVisit = active.filter((p) => !visitedOn(data, p.id, today));
  const fevers = active.filter((p) => { const r = todayReading(data, p.id, today); return r && isFever(r.value); });
  const eligible = active.filter((p) => isEligible(data, p, today));
  const approved = data.patients.filter((p) => p.status === "discharge_approved");
  const List = ({ items }: { items: Patient[] }) => (
    <Table head={["Bed", "Patient", "Today", "Fever-free", ""]} empty={!items.length}>
      {items.map((p) => (
        <tr key={p.id}><Td>{p.bed}</Td><Td><b>{p.name}</b></Td><Td><TempPill data={data} p={p} today={today} /></Td>
          <Td>{feverFreeStreak(data, p.id, today)}d</Td>
          <Td className="text-right"><Button size="sm" variant="outline" onClick={() => setOpen(p.id)}>Open</Button></Td></tr>
      ))}
    </Table>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Awaiting visit" value={awaitingVisit.length} tone={awaitingVisit.length ? "warning" : "success"} />
        <Stat label="Fever alerts" value={fevers.length} tone={fevers.length ? "danger" : undefined} />
        <Stat label="Eligible for discharge" value={eligible.length} tone="success" />
        <Stat label="Approved, awaiting admin" value={approved.length} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Fever alerts"><List items={fevers} /></Panel>
        <Panel title="Eligible for discharge"><List items={eligible} /></Panel>
        <Panel title="Awaiting today's visit" className="xl:col-span-2"><List items={awaitingVisit} /></Panel>
      </div>
      <PatientDialog patientId={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function AdminDash() {
  const { data, role, run, today } = useWard();
  const [reg, setReg] = useState(false);
  const occ = data.patients.filter(occupiesBed);
  const newToday = data.patients.filter((p) => p.admissionDate === today).length;
  const approved = data.patients.filter((p) => p.status === "discharge_approved");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Occupied beds" value={`${occ.length} / ${CAPACITY}`} />
        <Stat label="Available beds" value={CAPACITY - occ.length} tone={CAPACITY - occ.length === 0 ? "danger" : "success"} />
        <Stat label="New admissions today" value={newToday} />
        <Stat label="Discharges to complete" value={approved.length} tone={approved.length ? "warning" : undefined} />
      </div>
      <Panel title="Doctor-approved discharges" action={<Button size="sm" onClick={() => setReg(true)}>Register patient</Button>}>
        <Table head={["Bed", "Patient", "Admitted", "Status", ""]} empty={!approved.length}>
          {approved.map((p) => (
            <tr key={p.id}><Td>{p.bed}</Td><Td><b>{p.name}</b> <span className="text-muted-foreground">{p.id}</span></Td><Td>{fmtDate(p.admissionDate)}</Td>
              <Td><StatusPill s={p.status} /></Td>
              <Td className="text-right"><Button size="sm" onClick={() => run((d) => completeDischarge(d, role, p.id, new Date().toISOString()))}>Complete discharge</Button></Td></tr>
          ))}
        </Table>
      </Panel>
      <RegisterDialog open={reg} onClose={() => setReg(false)} />
    </div>
  );
}

function HeadDash() {
  const { data } = useWard();
  const m = mortality(data.patients);
  return (
    <div className="space-y-4">
      <MortalitySummary />
      <Panel title="Recent closed cases" action={<Link to="/reports" className="text-sm text-primary">Full report</Link>}>
        <ClosedCasesTable limit={8} />
      </Panel>
      <p className="text-xs text-muted-foreground">Mortality = deaths ÷ closed cases × 100 · threshold {MORTALITY_THRESHOLD}% · current <Pill tone={m.exceeds ? "danger" : "success"}>{m.rate.toFixed(1)}%</Pill></p>
    </div>
  );
}
