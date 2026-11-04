import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import AuthShell from "@/components/lab/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStudent } from "@/lib/auth-fns";
import { publicConfig } from "@/lib/admin-fns";

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: "Crear cuenta · Laboratorio" }] }),
  component: RegisterScreen,
});

function RegisterScreen() {
  const [form, setForm] = useState({ matricula: "", firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    publicConfig({ data: {} })
      .then((res) => res?.ok && setConfig(res))
      .catch(() => {});
  }, []);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    try {
      const res = await registerStudent({
        data: {
          matricula: form.matricula,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        },
      });
      if (!res.ok) setError(res.error);
      else setDone(true);
    } catch {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
    }
    setBusy(false);
  };

  return (
    <AuthShell
      eyebrow="Nuevo estudiante"
      title="Crear mi perfil"
      subtitle="Tu matrícula será tu usuario. Podrás iniciar sesión desde la red del laboratorio."
      footer={
        <Link to="/" className="font-medium text-primary hover:underline">
          Ya tengo cuenta, iniciar sesión
        </Link>
      }
    >
      {done ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <CheckCircle2 className="mb-2 h-5 w-5" />
          <p className="font-medium">Tu cuenta está lista.</p>
          <p className="mt-1 text-emerald-800">Ya puedes iniciar sesión con tu matrícula.</p>
          <Link to="/" className="mt-3 inline-block font-semibold underline">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {config && !config.registrationEnabled ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              El registro está cerrado en este momento.
              {config.registrationStart ? ` Abre el ${config.registrationStart}` : ""}
              {config.registrationEnd ? ` y cierra el ${config.registrationEnd}` : ""}. Puedes intentar más tarde.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              value={form.matricula}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, matricula: event.target.value.replace(/\D/g, "").slice(0, 8) }))
              }
              inputMode="numeric"
              placeholder="19237688"
              className="font-mono tracking-[0.15em]"
            />
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
            <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="tucorreo@ejemplo.com" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={form.password} onChange={set("password")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar</Label>
              <Input id="confirm" type="password" value={form.confirm} onChange={set("confirm")} />
            </div>
          </div>

          {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear cuenta
          </Button>
        </form>
      )}
    </AuthShell>
  );
}