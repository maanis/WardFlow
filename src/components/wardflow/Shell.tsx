import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, BedDouble, ClipboardList, LayoutDashboard, Moon, RotateCcw, Stethoscope, Sun, Thermometer, UserRoundCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWard } from "@/lib/wardflow/store";
import { CAPACITY, ROLE_LABEL, occupiesBed, type Role } from "@/lib/wardflow/logic";
import { WorkflowGuideDialog } from "./WorkflowGuideDialog";

const NAV = {
  nurse: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/temperatures", label: "Temperatures", icon: Thermometer },
  ],
  doctor: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/doctor", label: "Doctor Visits & Discharge", icon: Stethoscope },
  ],
  admin: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/admin", label: "Beds & Discharge", icon: BedDouble },
  ],
  head: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/reports", label: "Reports", icon: ClipboardList },
  ],
} as const;

const ROLE_ICONS: Record<Role, typeof UserRoundCog> = {
  nurse: Thermometer,
  doctor: Stethoscope,
  admin: BedDouble,
  head: ClipboardList,
};

export function Shell({ children }: { children: ReactNode }) {
  const { role, setRole, data, today, reset } = useWard();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const nav = useMemo(() => NAV[role], [role]);
  const occupied = useMemo(() => data.patients.filter(occupiesBed).length, [data.patients]);
  const RoleIcon = ROLE_ICONS[role];
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!nav.some((item) => item.to === pathname)) router.navigate({ to: "/", replace: true });
  }, [nav, pathname, router]);

  useEffect(() => {
    setDark(localStorage.getItem("wardflow:theme") === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("wardflow:theme", next ? "dark" : "light");
  };

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3.5">
          <Activity className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-accent-foreground">WardFlow</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="flex items-center justify-between"><div className="text-[11px] font-medium uppercase tracking-wider opacity-70">Ward snapshot</div><RoleIcon className="h-5 w-5 text-sidebar-primary" /></div>
            <div className="mt-3 flex items-end gap-2"><span className="text-3xl font-semibold text-sidebar-accent-foreground">{occupied}</span><span className="mb-1 text-xs opacity-70">of {CAPACITY} beds occupied</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sidebar-border"><div className="h-full rounded-full bg-sidebar-primary transition-[width] duration-700" style={{ width: `${(occupied / CAPACITY) * 100}%` }} /></div>
            <div className="mt-3 flex items-center justify-between border-t border-sidebar-border pt-3"><span className="text-[11px] opacity-70">Active workspace</span><span className="rounded-full bg-sidebar-primary/15 px-2 py-1 text-[11px] font-medium text-sidebar-primary">{ROLE_LABEL[role]}</span></div>
          </div>
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
          <Button size="icon" variant="ghost" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>
            {dark ? <Sun /> : <Moon />}
          </Button>
          <Select value={role} onValueChange={(value) => setRole(value as Role)}>
            <SelectTrigger aria-label="Change demo role" className="h-9 w-40 gap-2 rounded-lg bg-card px-2.5 shadow-sm sm:w-48">
              <RoleIcon className="h-4 w-4 shrink-0 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectLabel>Demo role</SelectLabel>
                {(Object.keys(ROLE_LABEL) as Role[]).map((itemRole) => <SelectItem key={itemRole} value={itemRole}>{ROLE_LABEL[itemRole]}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card px-2 py-1.5 md:hidden">
          {nav.map(({ to, label }) => (
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
