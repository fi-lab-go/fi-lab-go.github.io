import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/lab/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDeleteTeam, adminDeleteAllTeams, adminUpdateTeam } from "@/lib/admin-fns";

export default function TeamTable({ teams, token, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ hasNumber: true, teamNumber: "", members: "" });
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openEdit = (team) => {
    setEditing(team);
    setForm({
      hasNumber: team.has_number,
      teamNumber: team.team_number,
      members: team.members.join("\n"),
    });
    setError("");
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await adminUpdateTeam({
        data: {
          token,
          id: editing.id,
          hasNumber: form.hasNumber,
          teamNumber: form.teamNumber,
          members: form.members.split(/[\s,]+/).filter(Boolean),
        },
      });
      if (!res.ok) setError(res.error);
      else {
        toast.success("Equipo actualizado");
        setEditing(null);
        onRefresh();
      }
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    }
    setBusy(false);
  };

  const remove = async () => {
    try {
      const res = await adminDeleteTeam({ data: { token, id: deleting.id } });
      if (!res.ok) toast.error(res.error || "No se pudo eliminar.");
      else toast.success("Equipo eliminado");
      setDeleting(null);
      onRefresh();
    } catch {
      toast.error("No se pudo eliminar.");
    }
  };

  const removeAll = async () => {
    try {
      const res = await adminDeleteAllTeams({ data: { token } });
      if (!res.ok) toast.error(res.error || "No se pudo eliminar.");
      else toast.success("Se eliminaron todos los equipos");
      setDeletingAll(false);
      onRefresh();
    } catch {
      toast.error("No se pudo eliminar.");
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeletingAll(true)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar todos los equipos
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Materia</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Integrantes</TableHead>
              <TableHead>Sanción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!teams.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Aún no hay equipos registrados.
                </TableCell>
              </TableRow>
            ) : null}
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.subject}</TableCell>
                <TableCell>{team.has_number && team.team_number ? `#${team.team_number}` : "—"}</TableCell>
                <TableCell>
                  <div className="space-y-0.5 text-xs">
                    {team.members.map((member, index) => (
                      <p key={member}>
                        <span className="font-mono">{member}</span>{" "}
                        <span className="text-muted-foreground">{team.member_names[index]}</span>
                      </p>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {team.sanctioned ? (
                    <Badge variant="destructive">Hasta {team.sanctioned_until}</Badge>
                  ) : (
                    <Badge variant="secondary">Sin sanción</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Editar integrantes" onClick={() => openEdit(team)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar equipo" onClick={() => setDeleting(team)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar integrantes · {editing?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="team-num">Número de equipo</Label>
                <Input
                  id="team-num"
                  value={form.teamNumber}
                  disabled={!form.hasNumber}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, teamNumber: event.target.value.replace(/\D/g, "").slice(0, 4) }))
                  }
                  className="w-24 font-mono"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={!form.hasNumber}
                  onCheckedChange={(value) => setForm((prev) => ({ ...prev, hasNumber: !value }))}
                />
                No aplica
              </label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="members">Integrantes (una matrícula por línea)</Label>
              <Textarea
                id="members"
                rows={6}
                value={form.members}
                onChange={(event) => setForm((prev) => ({ ...prev, members: event.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar este equipo?"
        description={deleting ? `Se eliminará el equipo de ${deleting.subject} y sus apartados activos.` : ""}
        confirmLabel="Sí, eliminar"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />

      <ConfirmDialog
        open={deletingAll}
        title="¿Eliminar todos los equipos?"
        description="Se borrarán todos los equipos registrados y sus apartados activos. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar todo"
        destructive
        onCancel={() => setDeletingAll(false)}
        onConfirm={removeAll}
      />
    </>
  );
}