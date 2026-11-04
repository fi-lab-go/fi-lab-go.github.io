import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useLabUser } from "@/components/lab/LabShell";
import TeamTable from "@/components/lab/TeamTable";
import { adminListTeams } from "@/lib/admin-fns";

export const Route = createFileRoute("/admin/equipos")({
  head: () => ({ meta: [{ title: "Administrar equipos · Laboratorio" }] }),
  component: TeamsAdmin,
});

function TeamsAdmin() {
  const { token } = useLabUser();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await adminListTeams({ data: { token } });
      if (res.ok) setTeams(res.teams);
    } catch {
      setTeams([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Equipos</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Administrar Equipos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega o quita integrantes, elimina un equipo o borra todos los equipos del laboratorio.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <TeamTable teams={teams} token={token} onRefresh={load} />
      )}
    </div>
  );
}