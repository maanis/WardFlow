import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useWard } from "@/lib/wardflow/store";
import {
  CAPACITY, MORTALITY_THRESHOLD, ROLE_LABEL, feverFreeStreak, isEligible, isFever, mortality, occupiesBed, todayReading, visitedOn,
  completeDischarge, type Patient,
} from "@/lib/wardflow/logic";
import { PageHeader, Panel, Pill, Stat, StatusPill, Table, Td, TempPill, fmtDate } from "@/components/wardflow/ui";
import { PatientDialog, RegisterDialog, TempDialog } from "@/components/wardflow/dialogs";
import { MortalitySummary, ClosedCasesTable } from "@/components/wardflow/reports";

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
  const chartData = [
    { label: "Recorded", value: done, fill: "var(--color-recorded)", key: "recorded" },
    { label: "Pending", value: pending.length, fill: "var(--color-pending)", key: "pending" },
    { label: "Fever", value: fevers.length, fill: "var(--color-fever)", key: "fever" },
  ];
  const scatterData = active.map((patient) => ({ bed: patient.bed ?? 0, temperature: todayReading(data, patient.id, today)?.value ?? 0 })).filter((point) => point.temperature > 0);
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
      <Panel title="Today's reading overview" action={<span className="text-xs text-muted-foreground">Hover bars for details</span>}>
        <ChartContainer config={nurseChartConfig} className="h-56 w-full aspect-auto px-3 py-2">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="key" />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={900} />
          </BarChart>
        </ChartContainer>
      </Panel>
      <Panel title="Temperature distribution" action={<span className="text-xs text-muted-foreground">Bed vs. reading</span>}>
        <ChartContainer config={nurseChartConfig} className="h-56 w-full aspect-auto px-3 py-2">
          <ScatterChart margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid />
            <XAxis dataKey="bed" name="Bed" tickLine={false} axisLine={false} />
            <YAxis dataKey="temperature" name="Temperature" domain={[34, 42]} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent />} />
            <Scatter data={scatterData} fill="var(--color-recorded)" animationDuration={900} />
          </ScatterChart>
        </ChartContainer>
      </Panel>
      <TempDialog patient={temp} onClose={() => setTemp(null)} />
    </div>
  );
}

const nurseChartConfig = {
  recorded: { label: "Recorded", color: "var(--success)" },
  pending: { label: "Pending", color: "var(--warning)" },
  fever: { label: "Fever", color: "var(--danger)" },
} satisfies ChartConfig;

function DoctorDash() {
  const { data, today } = useWard();
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"fever" | "eligible" | "visits">("fever");
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
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={view === "fever" ? "default" : "outline"} onClick={() => setView("fever")}>Fever alerts ({fevers.length})</Button>
        <Button size="sm" variant={view === "eligible" ? "default" : "outline"} onClick={() => setView("eligible")}>Eligible ({eligible.length})</Button>
        <Button size="sm" variant={view === "visits" ? "default" : "outline"} onClick={() => setView("visits")}>Awaiting visits ({awaitingVisit.length})</Button>
      </div>
      <Panel title={view === "fever" ? "Fever alerts" : view === "eligible" ? "Eligible for discharge" : "Awaiting today's visit"}>
        <List items={view === "fever" ? fevers : view === "eligible" ? eligible : awaitingVisit} />
      </Panel>
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
