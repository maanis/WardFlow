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
      { property: "og:title", content: "Temperatures — WardFlow" },
      { property: "og:description", content: "Daily temperature tracking with fever flags." },
    ],
  }),
  component: Temps,
});

function Temps() {
  const { data, role, today } = useWard();
  const [sel, setSel] = useState<Patient | null>(null);
  const nurse = can(role, "recordTemp");
  const active = data.patients.filter(occupiesBed).sort((a, b) => (a.bed ?? 0) - (b.bed ?? 0));
  const pending = active.filter((p) => !todayReading(data, p.id, today));
  const done = active.filter((p) => todayReading(data, p.id, today));
  const corrections = [...data.corrections].sort((a, b) => b.at.localeCompare(a.at));
  const name = (id: string) => data.patients.find((p) => p.id === id)?.name ?? id;

  const Rows = ({ list }: { list: Patient[] }) => (
    <Table head={["Bed", "Patient", "Reading", "Status", "Fever", ""]} empty={!list.length}>
      {list.map((p) => {
        const r = todayReading(data, p.id, today);
        return (
          <tr key={p.id}>
            <Td>{p.bed}</Td><Td><b>{p.name}</b> <span className="text-muted-foreground">{p.id}</span></Td>
            <Td className="tabular-nums">{r ? `${r.value.toFixed(1)}°C` : "—"}</Td>
            <Td>{r ? <Pill tone="success">Completed</Pill> : <Pill tone="warning">Pending</Pill>}</Td>
            <Td>{r ? (isFever(r.value) ? <Pill tone="danger">Fever</Pill> : <Pill>Normal</Pill>) : ""}</Td>
            <Td className="text-right">{nurse && <Button size="sm" variant={r ? "outline" : "default"} onClick={() => setSel(p)}>{r ? "Correct" : "Record"}</Button>}</Td>
          </tr>
        );
      })}
    </Table>
  );

  return (
    <>
      <PageHeader title="Temperature tracking" sub={`${pending.length} pending · ${done.length} completed today`} />
      {!nurse && <RoleNote>View only. Only nurses can record or correct temperatures. Previous days are read-only.</RoleNote>}
      <div className="space-y-4">
        <Panel title={`Pending (${pending.length})`}><Rows list={pending} /></Panel>
        <Panel title={`Completed today (${done.length})`}><Rows list={done} /></Panel>
        <Panel title="Correction history">
          <Table head={["Time", "Patient", "Previous", "New", "Reason"]} empty={!corrections.length}>
            {corrections.map((c) => (
              <tr key={c.id}><Td>{fmtTime(c.at)}</Td><Td>{name(c.patientId)}</Td><Td>{c.oldValue.toFixed(1)}°C</Td><Td>{c.newValue.toFixed(1)}°C</Td><Td className="whitespace-normal">{c.reason}</Td></tr>
            ))}
          </Table>
        </Panel>
      </div>
      <TempDialog patient={sel} onClose={() => setSel(null)} />
    </>
  );
}
