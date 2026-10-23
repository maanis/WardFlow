import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { dayKey, type Role, type WardData } from "./logic";
import { makeSeed } from "./seed";

const KEY = "wardflow:data:v1";
const ROLE_KEY = "wardflow:role";

type Mut = { ok: true; data: WardData; message: string } | { ok: false; error: string };

interface Ctx {
  data: WardData;
  role: Role;
  setRole: (r: Role) => void;
  today: string;
  /** Runs a pure mutation, persists, and toasts. Returns true on success. */
  run: (fn: (d: WardData) => Mut) => boolean;
  reset: () => void;
}
const WardCtx = createContext<Ctx | null>(null);

export function WardProvider({ children }: { children: ReactNode }) {
  const [today] = useState(() => dayKey(new Date()));
  const [data, setData] = useState<WardData>(() => makeSeed(today));
  const [role, setRoleState] = useState<Role>("nurse");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw));
      const r = localStorage.getItem(ROLE_KEY) as Role | null;
      if (r) setRoleState(r);
    } catch { /* ignore corrupt storage */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, loaded]);

  const setRole = useCallback((r: Role) => { setRoleState(r); localStorage.setItem(ROLE_KEY, r); }, []);
  const run = useCallback((fn: (d: WardData) => Mut) => {
    const res = fn(data);
    if (!res.ok) { toast.error(res.error); return false; }
    setData(res.data); toast.success(res.message); return true;
  }, [data]);
  const reset = useCallback(() => { setData(makeSeed(today)); toast.success("Demo data reset."); }, [today]);

  const value = useMemo(() => ({ data, role, setRole, today, run, reset }), [data, role, setRole, today, run, reset]);
  return <WardCtx.Provider value={value}>{children}</WardCtx.Provider>;
}

export function useWard() {
  const c = useContext(WardCtx);
  if (!c) throw new Error("useWard outside WardProvider");
  return c;
}
