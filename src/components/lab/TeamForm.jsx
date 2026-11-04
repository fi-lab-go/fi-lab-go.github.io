import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBJECTS } from "@/lib/lab-constants";
import { createTeam } from "@/lib/team-fns";

const EMPTY_SLOTS = ["", "", "", "", ""];

export default function TeamForm({ token, subjectOptions, windowOpen, onCreated }) {
  const [subject, setSubject] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [noNumber, setNoNumber] = useState(false);
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateSlot = (index, value) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? value.replace(/\D/g, "").slice(0, 8) : slot)));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!subject) return setError("Selecciona la materia del equipo.");
    if (!noNumber && !teamNumber) return setError("Escribe el número de equipo o marca “No aplica”.");
    setBusy(true);
    try {
      const res = await createTeam({
        data: {
          token,
          subject,
          teamNumber,
          hasNumber: !noNumber,
          members: slots.filter(Boolean),
        },
      });
      if (!res.ok) setError(res.error);
      else {
        toast.success("Equipo creado");
        setSubject("");
        setTeamNumber("");
        setNoNumber(false);
        setSlots(EMPTY_SLOTS);
        onCreated?.();
      }
    } catch {
      setError("No se pudo crear el equipo. Intenta de nuevo.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {!windowOpen ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          La creación de equipos está cerrada. Un maestro debe abrir la ventana de registro de equipos.
        </p>
      ) : null}

      {!subjectOptions.length ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Ya tienes un equipo en cada materia disponible.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label>Materia</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la materia" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.filter((item) => subjectOptions.includes(item)).map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="team-number">Número de equipo</Label>
          <div className="flex items-center gap-3">
            <Input
              id="team-number"
              value={teamNumber}
              disabled={noNumber}
              onChange={(event) => setTeamNumber(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="12"
              className="w-24 font-mono"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={noNumber} onCheckedChange={(value) => setNoNumber(!!value)} />
              No aplica
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Integrantes (matrículas)</Label>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={slots.length >= 10}
              onClick={() => setSlots((prev) => [...prev, ""])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Agregar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={slots.length <= 1}
              onClick={() => setSlots((prev) => prev.slice(0, -1))}
            >
              <Minus className="mr-1 h-3.5 w-3.5" />
              Quitar
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {slots.map((slot, index) => (
            <Input
              key={index}
              value={slot}
              onChange={(event) => updateSlot(index, event.target.value)}
              inputMode="numeric"
              placeholder={`Matrícula ${index + 1}`}
              className="font-mono tracking-[0.1em]"
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Tu matrícula se agrega automáticamente. Todos los integrantes deben tener cuenta creada.
        </p>
      </div>

      {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={busy || !windowOpen || !subjectOptions.length}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Crear equipo
      </Button>
    </form>
  );
}