import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWard } from "@/lib/wardflow/store";
import { FEVER_FREE_DAYS_REQUIRED, can, feverFreeStreak, isEligible } from "@/lib/wardflow/logic";
import { PageHeader, Panel, Pill, StatusPill, Table, Td, TempPill, VisitPill, fmtTime } from "@/components/wardflow/ui";
import { PatientDialog } from "@/components/wardflow/dialogs";
import { RoleNote } from "@/components/wardflow/Shell";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Visits — WardFlow" },
      { name: "description", content: "Daily doctor visits, fever-free streaks and discharge approval." },
      { property: "og:title", content: "Doctor Visits — WardFlow" },
      { property: "og:description", content: "Doctor visits and discharge approval." },
    ],
  }),
  component: Doctor,
});

function Doctor() {
  const { data, role, today } = useWard();
  const [open, setOpen] = useState<string | null>(null);
  const active = data.patients.filter((p) => p.status === "active").sort((a, b) => (a.bed ?? 0) - (b.bed ?? 0));
  const approved = data.patients.filter((p) => p.status === "discharge_approved");

  return (
    <>
      <PageHeader title="Doctor visits & discharge" sub={`Discharge requires ${FEVER_FREE_DAYS_REQUIRED} consecutive fever-free days including today, plus today's visit.`} />
      {!can(role, "markVisit") && <RoleNote>View only. Switch to the Doctor role to record visits or approve discharges.</RoleNote>}
      <div className="space-y-4">
        <Panel title={`Approved — awaiting admin completion (${approved.length})`}>
          <Table head={["Bed", "Patient", "Approved", "Status"]} empty={!approved.length}>
            {approved.map((p) => <tr key={p.id}><Td>{p.bed}</Td><Td><b>{p.name}</b></Td><Td>{p.approvedAt ? fmtTime(p.approvedAt) : "—"}</Td><Td><StatusPill s={p.status} /></Td></tr>)}
          </Table>
        </Panel>
        <Panel title={`Active patients (${active.length})`}>
          <Table head={["Bed", "Patient", "Today's temp", "Visit", "Fever-free", "Discharge", ""]} empty={!active.length}>
            {active.map((p) => {
              const s = feverFreeStreak(data, p.id, today);
              return (
                <tr key={p.id}>
                  <Td>{p.bed}</Td><Td><b>{p.name}</b> <span className="text-muted-foreground">{p.id}</span></Td>
                  <Td><TempPill data={data} p={p} today={today} /></Td><Td><VisitPill data={data} p={p} today={today} /></Td>
                  <Td className="tabular-nums">{s} / {FEVER_FREE_DAYS_REQUIRED}</Td>
                  <Td>{isEligible(data, p, today) ? <Pill tone="success">Eligible</Pill> : <Pill>Not yet</Pill>}</Td>
                  <Td className="text-right"><Button size="sm" variant="outline" onClick={() => setOpen(p.id)}>Open</Button></Td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      </div>
      <PatientDialog patientId={open} onClose={() => setOpen(null)} />
    </>
  );
}
