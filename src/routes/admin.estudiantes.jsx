import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useLabUser } from "@/components/lab/LabShell";
import StudentTable from "@/components/lab/StudentTable";
import { adminListStudents } from "@/lib/admin-fns";

export const Route = createFileRoute("/admin/estudiantes")({
  head: () => ({ meta: [{ title: "Administrar estudiantes · Laboratorio" }] }),
  component: StudentsAdmin,
});

function StudentsAdmin() {
  const { token } = useLabUser();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await adminListStudents({ data: { token } });
      if (res.ok) setStudents(res.students);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Estudiantes</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">Administrar Estudiantes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edita la matrícula, el nombre o el apellido. El correo no se muestra ni se modifica desde aquí.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <StudentTable students={students} token={token} onRefresh={load} />
      )}
    </div>
  );
}