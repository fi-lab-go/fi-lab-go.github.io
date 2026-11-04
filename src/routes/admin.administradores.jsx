import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLabUser } from "@/components/lab/LabShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCreateAdmin, adminListAdmins } from "@/lib/admin-fns";

export const Route = createFileRoute("/admin/administradores")({
  head: () => ({ meta: [{ title: "Agregar administrador · Laboratorio" }] }),
  component: AdminsAdmin,
});

const EMPTY = { username: "", firstName: "", lastName: "", email: "", password: "" };

function AdminsAdmin() {
  const { token } = useLabUser();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminListAdmins({ data: { token } });
      if (res.ok) setAdmins(res.admins);
    } catch {
      setAdmins([]);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await adminCreateAdmin({ data: { token, ...form } });
      if (!res.ok) setError(res.error);
      else {
        toast.success("Administrador creado");
        setForm(EMPTY);
        load();
      }
    } catch {
      setError("No se pudo crear el administrador.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Maestros</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Agregar Administrador</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los perfiles de maestro solo se crean desde aquí. Comparte la contraseña de forma segura.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo administrador</CardTitle>
            <CardDescription>El usuario puede ser el nombre y apellido, por ejemplo “Eduardo May”.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuario</Label>
                <Input id="username" value={form.username} onChange={set("username")} placeholder="Eduardo May" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" value={form.firstName} onChange={set("firstName")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" value={form.lastName} onChange={set("lastName")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={form.password} onChange={set("password")} />
              </div>
              {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Crear administrador
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administradores actuales</CardTitle>
            <CardDescription>{admins.length} cuenta(s) de maestro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="rounded-xl border border-border/70 px-3 py-2">
                <p className="text-sm font-medium">{admin.username}</p>
                <p className="text-xs text-muted-foreground">
                  {admin.first_name} {admin.last_name} · {admin.email}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}