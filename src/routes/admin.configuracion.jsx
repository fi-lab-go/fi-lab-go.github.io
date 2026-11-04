import { createFileRoute } from "@tanstack/react-router";
import AdminSettingsPanel from "@/components/lab/AdminSettingsPanel";

export const Route = createFileRoute("/admin/configuracion")({
  head: () => ({ meta: [{ title: "Configuración · Laboratorio" }] }),
  component: SettingsAdmin,
});

function SettingsAdmin() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Ajustes</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activa o desactiva la restricción de red, la creación de cuentas de estudiante y la creación de equipos.
        </p>
      </div>
      <AdminSettingsPanel />
    </div>
  );
}