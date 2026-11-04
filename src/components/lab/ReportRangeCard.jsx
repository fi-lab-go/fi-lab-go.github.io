import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLabUser } from "@/components/lab/LabShell";
import { addDays, todayInTz, weekMondayOf } from "@/lib/lab-constants";
import { adminReservationsReport } from "@/lib/report-fns";
import { downloadReservationsXlsx } from "@/lib/reservations-export";

const MODES = [
  { key: "dia", label: "Día" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "rango", label: "Rango" },
];

function lastDayOfMonth(month) {
  const [year, m] = month.split("-").map(Number);
  return String(new Date(Date.UTC(year, m, 0)).getUTCDate()).padStart(2, "0");
}

function resolveRange(mode, values) {
  if (mode === "dia") return { from: values.date, to: values.date };
  if (mode === "semana") {
    const monday = weekMondayOf(values.date);
    return { from: monday, to: addDays(monday, 4) };
  }
  if (mode === "mes") {
    return { from: `${values.month}-01`, to: `${values.month}-${lastDayOfMonth(values.month)}` };
  }
  return { from: values.from, to: values.to };
}

function shortDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

export default function ReportRangeCard() {
  const { token } = useLabUser();
  const today = todayInTz();
  const [mode, setMode] = useState("semana");
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    date: today,
    month: today.slice(0, 7),
    from: `${today.slice(0, 7)}-01`,
    to: today,
  });

  const set = (key) => (event) => setValues((prev) => ({ ...prev, [key]: event.target.value }));
  const range = resolveRange(mode, values);

  const download = async () => {
    if (!range.from || !range.to) {
      toast.error("Elige las fechas del reporte.");
      return;
    }
    if (range.from > range.to) {
      toast.error("La fecha inicial debe ser anterior a la final.");
      return;
    }
    setBusy(true);
    try {
      const res = await adminReservationsReport({ data: { token, from: range.from, to: range.to } });
      if (!res.ok) toast.error(res.error);
      else if (!res.items.length) toast.info("No hay reservas registradas en ese periodo.");
      else {
        downloadReservationsXlsx(res.items, `reporte-reservas-${range.from}_${range.to}`);
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
        <CardTitle className="text-base">Reportes por periodo</CardTitle>
        <CardDescription>
          Historial completo de reservas (activas, canceladas, sanciones y asistencias) del periodo que elijas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={mode === item.key ? "default" : "outline"}
              onClick={() => setMode(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {mode === "dia" ? (
            <div className="space-y-1.5">
              <Label htmlFor="report-day">Día</Label>
              <Input id="report-day" type="date" value={values.date} onChange={set("date")} />
            </div>
          ) : null}

          {mode === "semana" ? (
            <div className="space-y-1.5">
              <Label htmlFor="report-week">Semana de</Label>
              <Input id="report-week" type="date" value={values.date} onChange={set("date")} />
            </div>
          ) : null}

          {mode === "mes" ? (
            <div className="space-y-1.5">
              <Label htmlFor="report-month">Mes</Label>
              <Input id="report-month" type="month" value={values.month} onChange={set("month")} />
            </div>
          ) : null}

          {mode === "rango" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="report-from">Desde</Label>
                <Input id="report-from" type="date" value={values.from} onChange={set("from")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-to">Hasta</Label>
                <Input id="report-to" type="date" value={values.to} onChange={set("to")} />
              </div>
            </>
          ) : null}
        </div>

        <p className={cn("rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground")}>
          Periodo del reporte: <span className="font-medium text-foreground">{shortDate(range.from)}</span> al{" "}
          <span className="font-medium text-foreground">{shortDate(range.to)}</span>
        </p>

        <Button onClick={download} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          Descargar reporte en Excel
        </Button>
      </CardContent>
    </Card>
  );
}