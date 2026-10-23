import { Children, cloneElement, isValidElement, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function PageHeader({ title, sub, children }: { title: string; sub?: string | undefined; children?: ReactNode }) {
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

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string | undefined; tone?: Tone | undefined }) {
  return (
    <div className="rounded-md border bg-card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums",
        tone === "danger" && "text-danger", tone === "warning" && "text-warning", tone === "success" && "text-success")}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("rounded-md border bg-card", className)}>
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>{action}
      </header>
      <div>{children}</div>
    </section>
  );
}

const ROWS_PER_PAGE = 10;

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean | undefined }) {
  const [page, setPage] = useState(0);
  const rows = Children.toArray(children);
  const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * ROWS_PER_PAGE;
  const visibleRows = rows.slice(start, start + ROWS_PER_PAGE);
  const animatedRows = visibleRows.map((row, index) => {
    if (!isValidElement<{ className?: string; style?: CSSProperties }>(row)) return row;
    return cloneElement(row, {
      className: cn(row.props.className, "animate-in fade-in-0 duration-700"),
      style: { ...row.props.style, animationDelay: `${index * 35}ms`, animationFillMode: "backwards" },
    });
  });

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  return (
    <div>
      <div className="overflow-x-hidden">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-2 py-2 font-medium sm:px-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {empty ? <tr><td colSpan={head.length} className="px-3 py-6 text-center text-muted-foreground">Nothing to show.</td></tr> : animatedRows}
          </tbody>
        </table>
      </div>
      {rows.length > ROWS_PER_PAGE && (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">Showing {start + 1}–{Math.min(start + ROWS_PER_PAGE, rows.length)} of {rows.length}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button>
            <span className="min-w-16 text-center text-xs text-muted-foreground">Page {currentPage + 1} of {pageCount}</span>
            <Button size="sm" variant="ghost" aria-label="Next page" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("whitespace-nowrap px-2 py-2 sm:px-3", className)}>{children}</td>;

export const fmtDate = (s: string) => new Date(s.length === 10 ? s + "T00:00:00" : s).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
export const fmtTime = (s: string) => new Date(s).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
