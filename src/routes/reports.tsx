import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/wardflow/ui";
import { ClosedCasesTable, MortalitySummary } from "@/components/wardflow/reports";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — WardFlow" },
      { name: "description", content: "Mortality rate, recoveries and closed cases versus the 15% threshold." },
      { property: "og:title", content: "Reports — WardFlow" },
      { property: "og:description", content: "Mortality statistics and closed cases." },
    ],
  }),
  component: Reports,
});

function Reports() {
  return (
    <>
      <PageHeader title="Reports" sub="Read-only outcomes. Mortality = deaths ÷ closed cases × 100." />
      <div className="space-y-4">
        <MortalitySummary />
        <Panel title="Closed cases"><ClosedCasesTable /></Panel>
      </div>
    </>
  );
}
