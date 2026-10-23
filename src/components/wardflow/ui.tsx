import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isFever, todayReading, visitedOn, type Patient, type PatientStatus, type WardData } from "@/lib/wardflow/logic";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";
const TONES: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/20",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info-soft text-accent-foreground border-primary/20",
};
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium", TONES[tone])}>{children}</span>;
}

const STATUS: Record<PatientStatus, [Tone, string]> = {
  active: ["info", "Active"], discharge_approved: ["warning", "Discharge approved"],
  discharged: ["success", "Discharged"], deceased: ["neutral", "Deceased"],
};
export const StatusPill = ({ s }: { s: PatientStatus }) => <Pill tone={STATUS[s][0]}>{STATUS[s][1]}</Pill>;

export function TempPill({ data, p, today }: { data: WardData; p: Patient; today: string }) {
  const r = todayReading(data, p.id, today);
  if (!r) return <Pill tone="warning">Pending</Pill>;
  return <Pill tone={isFever(r.value) ? "danger" : "success"}>{r.value.toFixed(1)}°C{isFever(r.value) ? " · Fever" : ""}</Pill>;
}
export function VisitPill({ data, p, today }: { data: WardData; p: Patient; today: string }) {
  return visitedOn(data, p.id, today) ? <Pill tone="success">Visited</Pill> : <Pill tone="neutral">Not visited</Pill>;
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  return (
    <div className="rounded-md border bg-card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums",
        tone === "danger" && "text-danger", tone === "warning" && "text-warning", tone === "success" && "text-success")}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border bg-card", className)}>
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>{action}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {empty ? <tr><td colSpan={head.length} className="px-3 py-6 text-center text-muted-foreground">Nothing to show.</td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("whitespace-nowrap px-3 py-2", className)}>{children}</td>;

export const fmtDate = (s: string) => new Date(s.length === 10 ? s + "T00:00:00" : s).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
export const fmtTime = (s: string) => new Date(s).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
