import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, FlaskConical, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth-fns";
import { clearSession } from "@/lib/session-client";

const STUDENT_LINKS = [
  { to: "/estudiante", label: "Horario" },
  { to: "/estudiante/equipo", label: "Equipo" },
  { to: "/estudiante/perfil", label: "Perfil" },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Horario" },
  { to: "/admin/estudiantes", label: "Administrar Estudiantes" },
  { to: "/admin/equipos", label: "Administrar Equipos" },
  { to: "/admin/reportes", label: "Reportes" },
  { to: "/admin/administradores", label: "Agregar Administrador" },
  { to: "/admin/configuracion", label: "Configuración" },
  { to: "/admin/perfil", label: "Perfil" },
];

export default function AppHeader({ user, role, token }) {
  const links = role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout({ data: { token } });
    } catch {
      // la sesión local se limpia de todas formas
    }
    clearSession();
    navigate({ to: "/" });
  };

  const displayName = role === "admin" ? user?.username : `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to={role === "admin" ? "/admin" : "/estudiante"} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FlaskConical className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span className="hidden sm:block">
            <span className="block font-heading text-sm font-semibold leading-tight">Laboratorio</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">
              {role === "admin" ? "Panel de maestros" : "Apartado de horarios"}
            </span>
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2 gap-1.5">
              <Menu className="h-4 w-4" />
              Menú
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {role === "admin" ? "Administración" : "Mi cuenta"}
            </DropdownMenuLabel>
            {links.map((link) => (
              <DropdownMenuItem key={link.to} asChild>
                <Link to={link.to} className="cursor-pointer">
                  {link.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={busy} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="font-mono text-[11px] leading-tight text-muted-foreground">
              {role === "admin" ? user?.email : user?.matricula}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase text-secondary-foreground">
            {(user?.first_name || "?").slice(0, 1)}
            {(user?.last_name || "").slice(0, 1)}
          </span>
        </div>
      </div>
    </header>
  );
}