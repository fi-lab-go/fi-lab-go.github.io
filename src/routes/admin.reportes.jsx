import { createFileRoute } from "@tanstack/react-router";
import ReportRangeCard from "@/components/lab/ReportRangeCard";
import ReportsBackupCard from "@/components/lab/ReportsBackupCard";

export const Route = createFileRoute("/admin/reportes")({
  head: () => ({ meta: [{ title: "Reportes · Laboratorio" }] }),
  component: ReportsAdmin,
});

function ReportsAdmin() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Reservas</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descarga los horarios de los estudiantes en Excel para tener un respaldo de las reservas.
        </p>
      </div>
      <ReportsBackupCard />
      <ReportRangeCard />
    </div>
  );
}