import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/lab/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-fns";

export const Route = createFileRoute("/recuperar")({
  head: () => ({ meta: [{ title: "Recuperar contraseña · Laboratorio" }] }),
  component: ForgotScreen,
});

function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await requestPasswordReset({ data: { email } });
      setMessage(res.message || "Si el correo está registrado, te enviamos un enlace.");
    } catch {
      setMessage("Si el correo está registrado, te enviamos un enlace.");
    }
    setBusy(false);
  };

  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      title="Restablecer contraseña"
      subtitle="Escribe el correo con el que te registraste y te enviaremos un enlace."
      footer={
        <Link to="/" className="font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        {message ? <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{message}</p> : null}
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enviar enlace
        </Button>
      </form>
    </AuthShell>
  );
}