import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLabUser } from "@/components/lab/LabShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStudentProfile } from "@/lib/auth-fns";

export const Route = createFileRoute("/estudiante/perfil")({
  head: () => ({ meta: [{ title: "Mi perfil · Laboratorio" }] }),
  component: StudentProfile,
});

function StudentProfile() {
  const { user, token } = useLabUser();
  const [email, setEmail] = useState(user.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await updateStudentProfile({ data: { token, email, currentPassword, newPassword } });
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del estudiante</CardTitle>
          <CardDescription>La matrícula, el nombre y el apellido solo los puede modificar un maestro.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Matrícula</p>
            <p className="font-mono text-lg font-semibold tracking-[0.1em]">{user.matricula}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nombre</p>
            <p className="text-lg font-medium">{user.first_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Apellido</p>
            <p className="text-lg font-medium">{user.last_name}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Correo y contraseña</CardTitle>
          <CardDescription>Tu correo sirve para restablecer la contraseña si la olvidas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
    </div>
  );
}