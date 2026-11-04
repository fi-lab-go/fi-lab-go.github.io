import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { acquireSlot, createReservation, releaseSlot } from "@/lib/schedule-fns";
import {
  BLOCKS,
  CAPACITY,
  MPS_OPTIONS,
  PLC_OPTIONS,
  PRACTICES,
  dayName,
  dayNumber,
  monthYearLabel,
  needsMps,
  needsPlc,
} from "@/lib/lab-constants";

export default function BookingDialog({ open, onClose, slot, myTeams = [], reservations = [], token, onDone }) {
  const [status, setStatus] = useState("loading");
  const [lockError, setLockError] = useState("");
  const [subject, setSubject] = useState("");
  const [practice, setPractice] = useState("");
  const [plc, setPlc] = useState("");
  const [mps, setMps] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !slot) return undefined;
    let alive = true;
    setStatus("loading");
    setLockError("");
    setError("");
    setSubject("");
    setPractice("");
    setPlc("");
    setMps("");
    acquireSlot({ data: { token, date: slot.date, block: slot.block } })
      .then((res) => {
        if (!alive) return;
        if (!res.ok) {
          setStatus("blocked");
          setLockError(res.error || "No se pudo abrir el apartado.");
          return;
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("blocked");
        setLockError("No se pudo abrir la ventana de apartado. Intenta de nuevo.");
      });
    return () => {
      alive = false;
    };
  }, [open, slot?.date, slot?.block, token]);

  const handleClose = () => {
    if (slot && status === "ready") {
      releaseSlot({ data: { token, date: slot.date, block: slot.block } }).catch(() => {});
    }
    onClose();
  };

  const dayReservations = reservations.filter((r) => r.date === slot?.date);
  const bookedTeamIds = new Set(dayReservations.map((r) => r.team_id));
  const availableTeams = myTeams.filter((t) => !t.sanctioned && !bookedTeamIds.has(t.id));
  const slotItems = reservations.filter((r) => r.date === slot?.date && r.block === slot?.block);
  const practiceItems = slotItems.filter((r) => r.subject === subject && r.practice === practice);
  const limit = CAPACITY[subject]?.[practice] ?? 0;

  const resetPractice = (value) => {
    setPractice(value);
    setPlc("");
    setMps("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!subject) return setError("Selecciona la materia.");
    if (!practice) return setError("Selecciona la práctica.");
    if (needsPlc(practice) && !plc) return setError("Selecciona el PLC.");
    if (needsMps(practice) && !mps) return setError("Selecciona la MPS.");
    setBusy(true);
    setError("");
    try {
      const res = await createReservation({
        data: { token, date: slot.date, block: slot.block, subject, practice, plc, mps },
      });
      if (!res.ok) {
        setError(res.error || "No se pudo apartar el horario.");
        setBusy(false);
        return;
      }
      toast.success("Horario apartado correctamente");
      setBusy(false);
      onDone?.();
      onClose();
    } catch {
      setError("Ocurrió un error al apartar. Intenta de nuevo.");
      setBusy(false);
    }
  };

  if (!slot) return null;
  const block = BLOCKS[slot.block];

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apartar horario</DialogTitle>
          <DialogDescription>
            {dayName(slot.date)} {dayNumber(slot.date)} de {monthYearLabel(slot.date)} · {block?.label} ·{" "}
            {slotItems.length} de 8 lugares ocupados
          </DialogDescription>
        </DialogHeader>

        {status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando disponibilidad…
          </div>
        ) : null}

        {status === "blocked" ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{lockError}</p>
          </div>
        ) : null}

        {status === "ready" && !availableTeams.length ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No tienes equipos disponibles para este día. Necesitas un equipo de la materia y no puede tener ya un horario
            apartado ese día (o el equipo está sancionado).
          </div>
        ) : null}

        {status === "ready" && availableTeams.length ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Materia</Label>
              <Select
                value={subject}
                onValueChange={(value) => {
                  setSubject(value);
                  resetPractice("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la materia" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.subject}>
                      {team.subject}
                      {team.has_number && team.team_number ? ` · Equipo ${team.team_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subject ? (
              <div className="space-y-1.5">
                <Label>Práctica</Label>
                <Select value={practice} onValueChange={resetPractice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la práctica" />
                  </SelectTrigger>
                  <SelectContent>
                    {(PRACTICES[subject] || []).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {needsPlc(practice) ? (
              <div className="space-y-1.5">
                <Label>PLC</Label>
                <Select value={plc} onValueChange={setPlc}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el PLC" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLC_OPTIONS.map((option) => {
                      const occupied = practice === "PLC" && practiceItems.some((r) => r.plc === option);
                      return (
                        <SelectItem key={option} value={option} disabled={occupied}>
                          {option}
                          {occupied ? " · ocupado" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {needsMps(practice) ? (
              <div className="space-y-1.5">
                <Label>MPS</Label>
                <Select value={mps} onValueChange={setMps}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la MPS" />
                  </SelectTrigger>
                  <SelectContent>
                    {MPS_OPTIONS.map((option) => {
                      const occupied = practiceItems.some((r) => r.plc === plc && r.mps === option);
                      return (
                        <SelectItem key={option} value={option} disabled={occupied}>
                          {option}
                          {occupied ? " · ocupado" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {practice ? (
              <p className="text-xs text-muted-foreground">
                Cupos para {practice}: {Math.max(limit - practiceItems.length, 0)} de {limit} disponibles en este horario.
              </p>
            ) : null}

            {error ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-medium leading-snug text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Tienes 15 minutos de tolerancia en dado caso que no llegues en ese lapso de tiempo se te sancionará por 1
                día sin poder apartar horario.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apartar horario
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}