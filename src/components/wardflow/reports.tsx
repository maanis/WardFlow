import { AlertTriangle, Info } from "lucide-react";
import { useWard } from "@/lib/wardflow/store";
import { MIN_CASES_FOR_RELIABLE_RATE, MORTALITY_THRESHOLD, isClosed, mortality, occupiesBed } from "@/lib/wardflow/logic";
import { Stat, StatusPill, Table, Td, fmtDate } from "./ui";

export function MortalitySummary() {
  const { data } = useWard();
  const m = mortality(data.patients);
  const active = data.patients.filter(occupiesBed).length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Active patients" value={active} />
        <Stat label="Closed cases" value={m.closed} />
        <Stat label="Recoveries" value={m.recoveries} tone="success" />
        <Stat label="Deaths" value={m.deaths} />
        <Stat label="Mortality rate" value={`${m.rate.toFixed(1)}%`} hint={`Threshold ${MORTALITY_THRESHOLD}%`} tone={m.exceeds ? "danger" : "success"} />
      </div>
      <div className="rounded-md border bg-card p-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>0%</span><span>Threshold {MORTALITY_THRESHOLD}%</span><span>30%</span></div>
        <div className="relative h-2.5 rounded-sm bg-muted">
          <div className={`h-full rounded-sm ${m.exceeds ? "bg-danger" : "bg-success"}`} style={{ width: `${Math.min(100, (m.rate / 30) * 100)}%` }} />
          <div className="absolute inset-y-[-3px] w-0.5 bg-foreground" style={{ left: "50%" }} />
        </div>
        {m.exceeds ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-danger"><AlertTriangle className="h-4 w-4" />Mortality exceeds the {MORTALITY_THRESHOLD}% threshold.</p>
        ) : <p className="mt-3 text-sm text-success">Mortality is within the {MORTALITY_THRESHOLD}% threshold.</p>}
        {m.limited && (
          <p className="mt-2 flex items-center gap-2 text-sm text-warning"><Info className="h-4 w-4" />
            Fewer than {MIN_CASES_FOR_RELIABLE_RATE} closed cases ({m.closed}) — the rate may not be statistically meaningful.</p>
        )}
      </div>
    </div>
  );
}

export function ClosedCasesTable({ limit }: { limit?: number }) {
  const { data } = useWard();
  const rows = data.patients.filter(isClosed).sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? "")).slice(0, limit);
  return (
    <Table head={["Patient", "Admitted", "Closed", "Outcome", "Note"]} empty={!rows.length}>
      {rows.map((p) => (
        <tr key={p.id}><Td><b>{p.name}</b> <span className="text-muted-foreground">{p.id}</span></Td>
          <Td>{fmtDate(p.admissionDate)}</Td><Td>{p.closedAt ? fmtDate(p.closedAt) : "—"}</Td>
          <Td><StatusPill s={p.status} /></Td><Td className="text-muted-foreground">{p.closeNote ?? ""}</Td></tr>
      ))}
    </Table>
  );
}

