import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminSettingsPanel from "@/components/lab/AdminSettingsPanel";
import { useLabUser } from "@/components/lab/LabShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateAdminProfile } from "@/lib/auth-fns";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({ meta: [{ title: "Mi perfil · Laboratorio" }] }),
  component: AdminProfile,
});

function AdminProfile() {
  const { user, token } = useLabUser();
  const [tab, setTab] = useState("cuenta");
  const [form, setForm] = useState({
    username: user.username || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await updateAdminProfile({ data: { token, ...form, currentPassword, newPassword } });
      if (!res.ok) setError(res.error);
      else {
        toast.success("Perfil actualizado");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Mi cuenta</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Perfil</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5 grid w-full grid-cols-2">
          <TabsTrigger value="cuenta">Mi cuenta</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="cuenta">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del administrador</CardTitle>
              <CardDescription>Puedes cambiar tu usuario, nombre, apellido, correo y contraseña.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Usuario</Label>
                  <Input id="username" value={form.username} onChange={set("username")} />
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="current">Contraseña actual</Label>
                    <Input
                      id="current"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="Solo si cambias la contraseña"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new">Contraseña nueva</Label>
                    <Input id="new" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                  </div>
                </div>
                {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracion">
          <AdminSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}