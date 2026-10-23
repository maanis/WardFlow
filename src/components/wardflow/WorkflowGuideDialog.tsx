import {
  BedDouble,
  BookOpen,
  ClipboardCheck,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const steps = [
  ["Admission", "Admin registers the patient and assigns an available bed.", UserRoundPlus],
  ["Daily temperature", "Nurse records the patient's official temperature for today.", Thermometer],
  ["Doctor review", "Doctor reviews the reading and records today's visit.", Stethoscope],
  ["Eligibility check", "WardFlow checks the fever-free streak and visit requirement.", ClipboardCheck],
  ["Clinical approval", "Doctor approves discharge when all eligibility rules are met.", ShieldCheck],
  ["Discharge completion", "Admin completes the approved discharge and releases the bed.", BedDouble],
  ["Outcome reporting", "The closed case appears in recovery, death, and mortality reports.", HeartPulse],
] as const;

const roles = [
  ["Nurse", "Records daily temperatures and corrects today's reading with a required reason. Cannot edit older readings or perform doctor/admin actions."],
  ["Doctor", "Records visits and optional notes, reviews fever-free days, approves eligible discharges, and records deaths. Cannot edit temperatures."],
  ["Admin", "Registers patients, assigns available beds, and completes doctor-approved discharges. Cannot modify clinical records."],
  ["Head Doctor", "Reviews mortality, recoveries, deaths, and closed cases with read-only access."],
] as const;

export function WorkflowGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <BookOpen className="h-4 w-4" />Help
        </Button>
      </DialogTrigger>
      <DialogContent className="grid h-[min(44rem,calc(100dvh-2rem))] w-[calc(100%-2rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:rounded-lg">
        <DialogHeader className="border-b bg-muted/30 px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />WardFlow Workflow Guide
          </DialogTitle>
          <DialogDescription>How patient operations move through the 74-bed quarantine centre.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-6 overflow-y-auto px-5 pb-5">
          <section className="pt-1">
            <h2 className="text-sm font-semibold">What is WardFlow?</h2>
            <p className="mt-1 text-sm text-muted-foreground">WardFlow coordinates daily temperature recording, doctor visits, discharge approvals, bed availability, and closed-case reporting for a 74-bed quarantine centre.</p>
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold">Understand the four roles</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map(([name, description]) => <div key={name} className="rounded-md border bg-card p-3"><div className="flex items-center gap-2 text-sm font-medium"><UsersRound className="h-4 w-4 text-primary" />{name}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>)}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">Complete patient workflow</h2>
            <ol className="space-y-3">
              {steps.map(([title, description, Icon], index) => <li key={title} className="flex gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{index + 1}</div><div className="min-w-0 border-l pb-1 pl-3"><div className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-primary" />{title}</div><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p></div></li>)}
            </ol>
            <p className="mt-3 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-5 text-warning">Doctor approval and admin completion are separate actions. Approval keeps the patient assigned to their bed; completion closes the case and frees the bed.</p>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <div><h2 className="text-sm font-semibold">Temperature rules</h2><ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground"><li>One official reading is allowed per patient per day.</li><li>Only today's reading may be corrected, and a reason is required.</li><li>38°C or above is flagged as fever.</li><li>Readings outside 34–42°C are rejected; below 35°C or above 41°C require confirmation.</li></ul></div>
            <div><h2 className="text-sm font-semibold">Discharge eligibility</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">A patient needs three consecutive fever-free days, including today, plus a doctor visit today. A missing temperature reading does not count as a fever-free day.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">These thresholds are demonstration assumptions, not medical advice.</p></div>
          </section>
          <section><h2 className="text-sm font-semibold">Reports and data</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Mortality is deaths divided by closed cases, multiplied by 100; active patients are excluded. WardFlow highlights rates above 15% and flags samples below 20 closed cases. Data is fictional and stored only in this browser's LocalStorage until it is cleared or demo data is reset.</p></section>
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">WardFlow is a prototype with simulated role switching and no real authentication, backend, or clinical-record capability.</div>
          <div className="flex justify-end"><DialogClose asChild><Button variant="outline">Close guide</Button></DialogClose></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
