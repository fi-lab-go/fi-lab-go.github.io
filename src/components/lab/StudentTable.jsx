import { useState } from "react";
import { AlertTriangle, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/lab/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDeleteStudent, adminUpdateStudent } from "@/lib/admin-fns";

export default function StudentTable({ students, token, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ matricula: "", firstName: "", lastName: "" });
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openEdit = (student) => {
    setEditing(student);
    setForm({ matricula: student.matricula, firstName: student.first_name, lastName: student.last_name });
    setError("");
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await adminUpdateStudent({ data: { token, id: editing.id, ...form } });
      if (!res.ok) setError(res.error);
      else {
        toast.success("Estudiante actualizado");
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
      const res = await adminDeleteStudent({ data: { token, id: deleting.id } });
      if (!res.ok) toast.error(res.error || "No se pudo eliminar.");
      else toast.success("Estudiante eliminado");
      setDeleting(null);
      onRefresh();
    } catch {
      toast.error("No se pudo eliminar.");
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matrícula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Sanción</TableHead>
              <TableHead>Equipos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!students.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Aún no hay estudiantes registrados.
                </TableCell>
              </TableRow>
            ) : null}
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-sm">{student.matricula}</TableCell>
                <TableCell>{student.first_name}</TableCell>
                <TableCell>{student.last_name}</TableCell>
                <TableCell>
                  {student.sanctioned ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Sancionado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sin sanción</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {student.teams.length ? (
                      student.teams.map((team) => (
                        <span key={team.id} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px]">
                          {team.subject}
                          {team.has_number && team.team_number ? ` · #${team.team_number}` : ""}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin equipo</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(student)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setDeleting(student)}>
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
            <DialogTitle>Editar estudiante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-matricula">Matrícula</Label>
              <Input
                id="edit-matricula"
                value={form.matricula}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, matricula: event.target.value.replace(/\D/g, "").slice(0, 8) }))
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lastname">Apellido</Label>
              <Input
                id="edit-lastname"
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
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
        title="¿Eliminar este estudiante?"
        description={
          deleting
            ? `Se borrará la cuenta de ${deleting.first_name} ${deleting.last_name} (${deleting.matricula}) y se quitará de sus equipos.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  );
}