import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import AuthShell from "@/components/lab/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-fns";

export const Route = createFileRoute("/restablecer")({
  validateSearch: (search) => ({ token: typeof search.token === "string" ? search.token : "" }),
  head: () => ({ meta: [{ title: "Nueva contraseña · Laboratorio" }] }),
  component: ResetScreen,
});

function ResetScreen() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    try {
      const res = await resetPassword({ data: { token, password } });
      if (!res.ok) setError(res.error);
      else setDone(true);
    } catch {
      setError("No se pudo cambiar la contraseña. Intenta de nuevo.");
    }
    setBusy(false);
  };

  return (
    <AuthShell
      eyebrow="Seguridad"
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta."
      footer={
        <Link to="/" className="font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      {done ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <CheckCircle2 className="mb-2 h-5 w-5" />
          <p className="font-medium">Contraseña actualizada.</p>
          <Link to="/" className="mt-3 inline-block font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {!token ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              El enlace no es válido. Solicita uno nuevo desde la pantalla de acceso.
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña nueva</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </div>
          {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="h-11 w-full" disabled={busy || !token}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar contraseña
          </Button>
        </form>
      )}
    </AuthShell>
  );
}