import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLabUser } from "@/components/lab/LabShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminGetSettings, adminUpdateSettings } from "@/lib/admin-fns";

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1 shrink-0" />
    </div>
  );
}

export default function AdminSettingsPanel() {
  const { token } = useLabUser();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminGetSettings({ data: { token } });
      if (res.ok) setForm(res.config);
    } catch {
      setForm(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await adminUpdateSettings({ data: { token, ...form } });
      if (!res.ok) toast.error(res.error || "No se pudo guardar.");
      else toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar.");
    }
    setBusy(false);
  };

  if (loading || !form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restricción de red</CardTitle>
          <CardDescription>
            Cuando está activa, los estudiantes solo pueden iniciar sesión desde las redes del laboratorio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle
            label="Restringir inicio de sesión por IP"
            description={form.ip_restriction_enabled ? "Activa: solo redes permitidas" : "Desactivada: cualquier red"}
            checked={form.ip_restriction_enabled}
            onChange={(value) => set("ip_restriction_enabled", value)}
          />
          <Textarea
            rows={3}
            value={form.allowed_ips}
            onChange={(event) => set("allowed_ips", event.target.value)}
            className="font-mono text-sm"
            placeholder="10.4.26.250, 10.0.98.40"
          />
          <p className="text-[11px] text-muted-foreground">
            Separa cada IP con coma o salto de línea. Los maestros entran desde cualquier red.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro de estudiantes</CardTitle>
          <CardDescription>Activa o desactiva la creación de cuentas de estudiante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Permitir creación de cuentas"
            description={form.registration_enabled ? "Los estudiantes pueden registrarse" : "El registro está cerrado"}
            checked={form.registration_enabled}
            onChange={(value) => set("registration_enabled", value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-start">Abre el</Label>
              <Input
                id="reg-start"
                type="date"
                value={form.registration_start}
                onChange={(event) => set("registration_start", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-end">Cierra el</Label>
              <Input
                id="reg-end"
                type="date"
                value={form.registration_end}
                onChange={(event) => set("registration_end", event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creación de equipos</CardTitle>
          <CardDescription>Activa o desactiva que los estudiantes formen equipos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Permitir creación de equipos"
            description={form.teams_enabled ? "Los estudiantes pueden crear equipos" : "La creación de equipos está cerrada"}
            checked={form.teams_enabled}
            onChange={(value) => set("teams_enabled", value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="team-start">Abre el</Label>
              <Input
                id="team-start"
                type="date"
                value={form.teams_start}
                onChange={(event) => set("teams_start", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-end">Cierra el</Label>
              <Input
                id="team-end"
                type="date"
                value={form.teams_end}
                onChange={(event) => set("teams_end", event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Guardar configuración
      </Button>
    </div>
  );
}