import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Loader2, Users } from "lucide-react";
import { useLabUser } from "@/components/lab/LabShell";
import TeamForm from "@/components/lab/TeamForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BLOCKS, SUBJECTS, SUBJECT_STYLES, dayShort, dayNumber, monthYearLabel } from "@/lib/lab-constants";
import { getStudentTeams } from "@/lib/team-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estudiante/equipo")({
  head: () => ({ meta: [{ title: "Mi equipo · Laboratorio" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { token } = useLabUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getStudentTeams({ data: { token } });
      if (res.ok) setData(res);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const teams = data?.teams || [];
  const usedSubjects = teams.map((team) => team.subject);
  const available = SUBJECTS.filter((subject) => !usedSubjects.includes(subject));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Equipos</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Mi equipo</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Puedes pertenecer como máximo a un equipo por materia (3 equipos en total).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crear equipo</CardTitle>
              <CardDescription>Elige la materia y registra las matrículas de tus integrantes.</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamForm token={token} subjectOptions={available} windowOpen={!!data?.windowOpen} onCreated={load} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">Mis equipos</h2>
            {!teams.length ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Users className="h-6 w-6 text-muted-foreground/60" />
                  Todavía no perteneces a ningún equipo.
                </CardContent>
              </Card>
            ) : null}

            {teams.map((team) => {
              const schedule = (data?.schedules || []).find((item) => item.team_id === team.id);
              const style = SUBJECT_STYLES[team.subject];
              return (
                <Card key={team.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                          {team.subject}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {team.has_number && team.team_number ? `Equipo ${team.team_number}` : "Sin número de equipo"}
                        </CardDescription>
                      </div>
                      {team.sanctioned ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Sancionado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Activo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Integrantes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {team.members.map((member) => (
                          <span key={member} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                    {team.sanctioned ? (
                      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Sanción activa hasta el {team.sanctioned_until}. No pueden apartar horario de esta materia.
                      </p>
                    ) : null}
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Horarios apartados</p>
                      {schedule?.booked?.length ? (
                        <ul className="space-y-1">
                          {schedule.booked.map((item) => (
                            <li key={item.id} className="rounded-lg border border-border/70 px-2.5 py-1.5 text-xs">
                              <span className="font-medium">
                                {dayShort(item.date)} {dayNumber(item.date)} de {monthYearLabel(item.date)}
                              </span>{" "}
                              · {BLOCKS[item.block]?.label} · {item.practice}
                              {item.plc ? ` · ${item.plc}` : ""}
                              {item.mps ? ` · ${item.mps}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin horarios apartados.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}