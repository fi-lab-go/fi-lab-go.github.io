import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLabUser } from "@/components/lab/LabShell";
import { todayInTz } from "@/lib/lab-constants";
import { adminReservationsReport } from "@/lib/report-fns";
import { downloadReservationsXlsx } from "@/lib/reservations-export";

export default function ReportsBackupCard() {
  const { token } = useLabUser();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await adminReservationsReport({ data: { token, activeOnly: true } });
      if (!res.ok) toast.error(res.error);
      else if (!res.items.length) toast.info("No hay reservas activas en este momento.");
      else {
        downloadReservationsXlsx(res.items, `reservas-actuales-${todayInTz()}`);
        toast.success(`${res.items.length} reservas descargadas`);
      }
    } catch {
      toast.error("No se pudo generar el archivo.");
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Respaldo de reservas actuales</CardTitle>
        <CardDescription>
          Descarga en Excel todas las reservas vigentes del laboratorio, con materia, práctica, equipo e integrantes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={download} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Descargar todas las reservas actuales
        </Button>
      </CardContent>
    </Card>
  );
}