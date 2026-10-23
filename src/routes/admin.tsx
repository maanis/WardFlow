import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWard } from "@/lib/wardflow/store";
import { CAPACITY, can, completeDischarge, occupiesBed } from "@/lib/wardflow/logic";
import { PageHeader, Panel, Stat, StatusPill, Table, Td, fmtTime } from "@/components/wardflow/ui";
import { RegisterDialog } from "@/components/wardflow/dialogs";
import { RoleNote } from "@/components/wardflow/Shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Beds & Discharge — WardFlow" },
      { name: "description", content: "Bed occupancy, admissions and completion of doctor-approved discharges." },
      { property: "og:title", content: "Beds & Discharge — WardFlow" },
      { property: "og:description", content: "Bed management for 74 beds." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data, role, run } = useWard();
  const [reg, setReg] = useState(false);
  const isAdmin = can(role, "completeDischarge");
  const occ = data.patients.filter(occupiesBed);
  const byBed = new Map(occ.map((p) => [p.bed, p]));
  const approved = data.patients.filter((p) => p.status === "discharge_approved");

  return (
    <>
      <PageHeader title="Beds & discharge">{isAdmin && <Button size="sm" onClick={() => setReg(true)} disabled={occ.length >= CAPACITY}>Register patient</Button>}</PageHeader>
      {!isAdmin && <RoleNote>View only. Switch to the Admin role to register patients or complete discharges.</RoleNote>}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total capacity" value={CAPACITY} />
          <Stat label="Occupied" value={occ.length} />
          <Stat label="Available" value={CAPACITY - occ.length} tone={CAPACITY - occ.length ? "success" : "danger"} />
        </div>
        <Panel title={`Discharges awaiting completion (${approved.length})`}>
          <Table head={["Bed", "Patient", "Approved", "Status", ""]} empty={!approved.length}>
            {approved.map((p) => (
              <tr key={p.id}><Td>{p.bed}</Td><Td><b>{p.name}</b> <span className="text-muted-foreground">{p.id}</span></Td>
                <Td>{p.approvedAt ? fmtTime(p.approvedAt) : "—"}</Td><Td><StatusPill s={p.status} /></Td>
                <Td className="text-right">{isAdmin && <Button size="sm" onClick={() => run((d) => completeDischarge(d, role, p.id, new Date().toISOString()))}>Complete & free bed</Button>}</Td></tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Bed occupancy">
          <div className="grid grid-cols-6 gap-1.5 p-3 sm:grid-cols-10 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
            {Array.from({ length: CAPACITY }, (_, i) => i + 1).map((b) => {
              const p = byBed.get(b);
              return (
                <div key={b} title={p ? `${p.name} (${p.id})` : "Available"}
                  className={cn("rounded-sm border px-1 py-1.5 text-center text-xs tabular-nums",
                    !p && "bg-card text-muted-foreground",
                    p?.status === "active" && "border-primary/30 bg-accent text-accent-foreground",
                    p?.status === "discharge_approved" && "border-warning/30 bg-warning-soft text-warning")}>{b}</div>
              );
            })}
          </div>
          <div className="flex gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" />Occupied</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-warning-soft align-middle" />Discharge approved</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border bg-card align-middle" />Available</span>
          </div>
        </Panel>
      </div>
      <RegisterDialog open={reg} onClose={() => setReg(false)} />
    </>
  );
}
