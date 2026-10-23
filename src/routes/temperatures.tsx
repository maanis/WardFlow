import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWard } from "@/lib/wardflow/store";
import { can, isFever, occupiesBed, todayReading, type Patient } from "@/lib/wardflow/logic";
import { PageHeader, Panel, Pill, Table, Td, fmtTime } from "@/components/wardflow/ui";
import { TempDialog } from "@/components/wardflow/dialogs";
import { RoleNote } from "@/components/wardflow/Shell";

export const Route = createFileRoute("/temperatures")({
  head: () => ({
    meta: [
      { title: "Temperatures — WardFlow" },
      { name: "description", content: "Record and correct today's official temperature readings." },
    ],
  }),
  component: Temps,
});

function Temps() {
  const { data, role, today } = useWard();
  const [selected, setSelected] = useState<Patient | null>(null);
  const [view, setView] = useState<"pending" | "completed" | "corrections">("pending");
  const nurse = can(role, "recordTemp");
  const active = data.patients.filter(occupiesBed).sort((a, b) => (a.bed ?? 0) - (b.bed ?? 0));
  const pending = active.filter((patient) => !todayReading(data, patient.id, today));
  const completed = active.filter((patient) => todayReading(data, patient.id, today));
  const corrections = [...data.corrections].sort((a, b) => b.at.localeCompare(a.at));
  const patientName = (id: string) => data.patients.find((patient) => patient.id === id)?.name ?? id;

  const rows = (patients: Patient[]) => (
    <Table head={["Bed", "Patient", "Reading", "Status", "Fever", ""]} empty={!patients.length}>
      {patients.map((patient) => {
        const reading = todayReading(data, patient.id, today);
        return <tr key={patient.id}><Td>{patient.bed}</Td><Td><b>{patient.name}</b> <span className="text-muted-foreground">{patient.id}</span></Td><Td className="tabular-nums">{reading ? `${reading.value.toFixed(1)}°C` : "—"}</Td><Td>{reading ? <Pill tone="success">Completed</Pill> : <Pill tone="warning">Pending</Pill>}</Td><Td>{reading ? (isFever(reading.value) ? <Pill tone="danger">Fever</Pill> : <Pill>Normal</Pill>) : ""}</Td><Td className="text-right">{nurse && <Button size="sm" variant={reading ? "outline" : "default"} onClick={() => setSelected(patient)}>{reading ? "Correct" : "Record"}</Button>}</Td></tr>;
      })}
    </Table>
  );

  const title = view === "pending" ? `Pending readings (${pending.length})` : view === "completed" ? `Completed today (${completed.length})` : "Correction history";

  return <>
    <PageHeader title="Temperature tracking" sub={`${pending.length} pending · ${completed.length} completed today`} />
    {!nurse && <RoleNote>View only. Only nurses can record or correct temperatures. Previous days are read-only.</RoleNote>}
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={view === "pending" ? "default" : "outline"} onClick={() => setView("pending")}>Pending ({pending.length})</Button>
        <Button size="sm" variant={view === "completed" ? "default" : "outline"} onClick={() => setView("completed")}>Completed ({completed.length})</Button>
        <Button size="sm" variant={view === "corrections" ? "default" : "outline"} onClick={() => setView("corrections")}>Corrections ({corrections.length})</Button>
      </div>
      <Panel title={title}>
        {view === "pending" && rows(pending)}
        {view === "completed" && rows(completed)}
        {view === "corrections" && <Table head={["Time", "Patient", "Previous", "New", "Reason"]} empty={!corrections.length}>{corrections.map((correction) => <tr key={correction.id}><Td>{fmtTime(correction.at)}</Td><Td>{patientName(correction.patientId)}</Td><Td>{correction.oldValue.toFixed(1)}°C</Td><Td>{correction.newValue.toFixed(1)}°C</Td><Td className="whitespace-normal">{correction.reason}</Td></tr>)}</Table>}
      </Panel>
    </div>
    <TempDialog patient={selected} onClose={() => setSelected(null)} />
  </>;
}
