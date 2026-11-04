import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/lab/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginAdmin, loginStudent, sessionInfo } from "@/lib/auth-fns";
import { publicConfig } from "@/lib/admin-fns";
import { getToken, saveSession } from "@/lib/session-client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Acceso · Laboratorio de Automatización" }] }),
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("student");
  const [matricula, setMatricula] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      sessionInfo({ data: { token } })
        .then((res) => {
          if (res?.ok) navigate({ to: res.role === "admin" ? "/admin" : "/estudiante" });
        })
        .catch(() => {});
    }
    publicConfig({ data: {} })
      .then((res) => res?.ok && setRegistration(res))
      .catch(() => {});
  }, [navigate]);

  const enter = (res) => {
    saveSession(res.token, res.role);
    navigate({ to: res.role === "admin" ? "/admin" : "/estudiante" });
  };

  const handleStudent = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await loginStudent({ data: { matricula, password: studentPassword } });
      if (!res.ok) setError(res.error);
      else enter(res);
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    }
    setBusy(false);
  };

  const handleAdmin = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await loginAdmin({ data: { username, password: adminPassword } });
      if (!res.ok) setError(res.error);
      else enter(res);
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    }
    setBusy(false);
  };

  return (
    <AuthShell
      eyebrow="Acceso al sistema"
      title="Inicia sesión"
      subtitle="Estudiantes con su matrícula. Maestros con su usuario de administrador."
      footer={
        <div className="flex flex-col gap-1.5">
          <Link to="/recuperar" className="font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      }
    >
      <Tabs value={tab} onValueChange={(value) => { setTab(value); setError(""); }}>
        <TabsList className="mb-5 grid w-full grid-cols-2">
          <TabsTrigger value="student">Estudiante</TabsTrigger>
          <TabsTrigger value="admin">Maestro</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <form onSubmit={handleStudent} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={matricula}
                onChange={(event) => setMatricula(event.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                placeholder="19237688"
                className="font-mono tracking-[0.15em]"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-password">Contraseña</Label>
              <Input
                id="student-password"
                type="password"
                value={studentPassword}
                onChange={(event) => setStudentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {registration?.registrationEnabled ? (
                <>
                  Registro abierto.{" "}
                  <Link to="/registro" className="font-semibold text-primary hover:underline">
                    Crear mi cuenta
                  </Link>
                </>
              ) : (
                <>
                  Registro cerrado por el administrador.{" "}
                  <Link to="/registro" className="font-medium text-primary hover:underline">
                    Ver detalles
                  </Link>
                </>
              )}
            </p>
          </form>
        </TabsContent>

        <TabsContent value="admin">
          <form onSubmit={handleAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-user">Usuario o correo</Label>
              <Input
                id="admin-user"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Eduardo May"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Contraseña</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar como maestro
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Las cuentas de maestro solo las crea otro administrador.
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </AuthShell>
  );
}