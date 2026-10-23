import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWard } from "@/lib/wardflow/store";
import { can, type PatientStatus } from "@/lib/wardflow/logic";
import { PageHeader, Panel, StatusPill, Table, Td, TempPill, VisitPill, fmtDate } from "@/components/wardflow/ui";
import { PatientDialog, RegisterDialog } from "@/components/wardflow/dialogs";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "Patients — WardFlow" },
      { name: "description", content: "Search patients, see beds, temperature and visit status, and register admissions." },
      { property: "og:title", content: "Patients — WardFlow" },
      { property: "og:description", content: "Patient management for the quarantine centre." },
    ],
  }),
  component: Patients,
});

const FILTERS: { v: "all" | PatientStatus; l: string }[] = [
  { v: "all", l: "All" }, { v: "active", l: "Active" }, { v: "discharge_approved", l: "Discharge approved" },
  { v: "discharged", l: "Discharged" }, { v: "deceased", l: "Deceased" },
];

function Patients() {
  const { data, role, today } = useWard();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | PatientStatus>("active");
  const [open, setOpen] = useState<string | null>(null);
  const [reg, setReg] = useState(false);
  const rows = useMemo(() => data.patients
    .filter((p) => f === "all" || p.status === f)
    .filter((p) => !q || `${p.name} ${p.id} ${p.bed ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.bed ?? 999) - (b.bed ?? 999)), [data.patients, q, f]);

  return (
    <>
      <PageHeader title="Patients" sub={`${rows.length} shown`}>
        {can(role, "registerPatient") && <Button size="sm" onClick={() => setReg(true)}>Register patient</Button>}
      </PageHeader>
      <Panel title="Patient list" action={
        <div className="relative w-56"><Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input className="h-8 pl-7" placeholder="Name, ID or bed" value={q} onChange={(e) => setQ(e.target.value)} /></div>}>
        <div className="flex flex-wrap gap-1 border-b px-3 py-2">
          {FILTERS.map((x) => (
            <button key={x.v} onClick={() => setF(x.v)}
              className={`rounded-sm px-2 py-1 text-xs font-medium ${f === x.v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>{x.l}</button>
          ))}
        </div>
        <Table head={["ID", "Name", "Bed", "Admitted", "Today's temp", "Doctor visit", "Status", ""]} empty={!rows.length}>
          {rows.map((p) => {
            const live = p.status === "active" || p.status === "discharge_approved";
            return (
              <tr key={p.id} className="hover:bg-muted/40">
                <Td className="font-mono text-xs">{p.id}</Td><Td className="font-medium">{p.name}</Td><Td>{p.bed ?? "—"}</Td>
                <Td>{fmtDate(p.admissionDate)}</Td>
                <Td>{live ? <TempPill data={data} p={p} today={today} /> : "—"}</Td>
                <Td>{live ? <VisitPill data={data} p={p} today={today} /> : "—"}</Td>
                <Td><StatusPill s={p.status} /></Td>
                <Td className="text-right"><Button size="sm" variant="ghost" onClick={() => setOpen(p.id)}>Details</Button></Td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <PatientDialog patientId={open} onClose={() => setOpen(null)} />
      <RegisterDialog open={reg} onClose={() => setReg(false)} />
    </>
  );
}
