import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, BedDouble, ClipboardList, LayoutDashboard, RotateCcw, Stethoscope, Thermometer, Users } from "lucide-react";
import { useWard } from "@/lib/wardflow/store";
import { CAPACITY, ROLE_LABEL, occupiesBed, type Role } from "@/lib/wardflow/logic";
import { WorkflowGuideDialog } from "./WorkflowGuideDialog";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/temperatures", label: "Temperatures", icon: Thermometer },
  { to: "/doctor", label: "Doctor", icon: Stethoscope },
  { to: "/admin", label: "Beds & Discharge", icon: BedDouble },
  { to: "/reports", label: "Reports", icon: ClipboardList },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { role, setRole, data, today, reset } = useWard();
  const occupied = data.patients.filter(occupiesBed).length;
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5">
          <Activity className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-accent-foreground">WardFlow</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs">
          <div>Occupancy</div>
          <div className="mt-1 text-sidebar-accent-foreground"><b>{occupied}</b> / {CAPACITY} beds</div>
          <button onClick={reset} className="mt-3 flex items-center gap-1 opacity-70 hover:opacity-100"><RotateCcw className="h-3 w-3" />Reset demo data</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-card px-4">
          <span className="font-semibold md:hidden">WardFlow</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Quarantine Centre · {new Date(today + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </span>
          <div className="ml-auto"><WorkflowGuideDialog /></div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Demo role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}
              className="h-8 rounded-md border border-input bg-card px-2 text-sm font-medium">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </label>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-1.5 md:hidden">
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }} className="whitespace-nowrap rounded-md px-2.5 py-1 text-sm text-muted-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}>{label}</Link>
          ))}
        </nav>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export function RoleNote({ children }: { children: ReactNode }) {
  return <div className="mb-4 rounded-md border bg-info-soft px-3 py-2 text-sm text-accent-foreground">{children}</div>;
}
