import { useState } from "react";
import { CalendarX2, ShieldAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/lab/ConfirmDialog";
import { adminDeleteReservation, cancelReservation, revertSanction, sanctionReservation } from "@/lib/schedule-fns";
import {
  BLOCKS,
  REVERT_WINDOW_MIN,
  SANCTION_GRACE_MIN,
  SANCTION_WINDOW_MIN,
  SUBJECT_STYLES,
  addDays,
  blockStartMinutes,
  dayName,
  dayNumber,
  minutesInTz,
  monthYearLabel,
} from "@/lib/lab-constants";
import { cn } from "@/lib/utils";

const ACTIONS = {
  cancel: { title: "¿Cancelar este apartado?", description: "Se liberará el horario para otros equipos.", label: "Sí, cancelar" },
  remove: { title: "¿Eliminar este apartado?", description: "El horario quedará libre. Esta acción no se puede deshacer.", label: "Sí, eliminar" },
  sanction: {
    title: "¿Sancionar al equipo?",
    description: "El equipo no podrá apartar horario de esta materia durante 2 días (el día del apartado y el siguiente). Tendrás 15 minutos para revertirlo.",
    label: "Sí, sancionar",
  },
  revert: { title: "¿Revertir la sanción?", description: "El equipo podrá volver a apartar horario de inmediato.", label: "Sí, revertir" },
};

export default function SlotDetailsDialog({ open, onClose, slot, reservations = [], role, token, myTeamIds = [], onDone }) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!slot) return null;
  const block = BLOCKS[slot.block];
  const items = reservations.filter((r) => r.date === slot.date && r.block === slot.block);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const now = minutesInTz();
  const start = blockStartMinutes(slot.block);

  const run = async (action, reservation) => {
    setBusy(true);
    const calls = {
      cancel: cancelReservation,
      remove: adminDeleteReservation,
      sanction: sanctionReservation,
      revert: revertSanction,
    };
    try {
      const res = await calls[action]({ data: { token, id: reservation.id } });
      if (!res.ok) toast.error(res.error || "No se pudo completar la acción.");
      else toast.success("Listo");
      setPending(null);
      onDone?.();
    } catch {
      toast.error("Ocurrió un error. Intenta de nuevo.");
    }
    setBusy(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Horarios apartados</DialogTitle>
            <DialogDescription>
              {dayName(slot.date)} {dayNumber(slot.date)} de {monthYearLabel(slot.date)} · {block?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {!items.length ? <p className="py-6 text-center text-sm text-muted-foreground">No hay apartados en este horario.</p> : null}
            {items.map((reservation) => {
              const style = SUBJECT_STYLES[reservation.subject] || SUBJECT_STYLES["CNC"];
              const canRemove = role === "admin" && reservation.date <= addDays(today, 1);
              const canSanction =
                role === "admin" && reservation.date === today && now >= start + SANCTION_GRACE_MIN && now <= start + SANCTION_WINDOW_MIN;
              const canRevert =
                role === "admin" &&
                reservation.sanctioned_at &&
                (Date.now() - new Date(reservation.sanctioned_at).getTime()) / 60000 <= REVERT_WINDOW_MIN;
              const canCancel = role === "student" && reservation.created_today && myTeamIds.includes(reservation.team_id);

              return (
                <div key={reservation.id} className="rounded-xl border border-border/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                        {reservation.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">{reservation.practice}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-medium">
                        {reservation.has_number && reservation.team_number
                          ? `Equipo ${reservation.team_number}`
                          : reservation.booker_name}
                      </p>
                      <p className="text-muted-foreground">{reservation.booker_matricula}</p>
                    </div>
                  </div>

                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {reservation.plc ? (
                      <div className="flex justify-between gap-1">
                        <dt>PLC</dt>
                        <dd className="font-medium text-foreground">{reservation.plc}</dd>
                      </div>
                    ) : null}
                    {reservation.mps ? (
                      <div className="flex justify-between gap-1">
                        <dt>MPS</dt>
                        <dd className="font-medium text-foreground">{reservation.mps}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-1">
                      <dt>Integrantes</dt>
                      <dd className="font-medium text-foreground">{reservation.team_members?.length || 0}</dd>
                    </div>
                    {reservation.sanctioned_until ? (
                      <div className="flex justify-between gap-1">
                        <dt>Sanción</dt>
                        <dd className="font-medium text-destructive">hasta {reservation.sanctioned_until}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {canCancel || canRemove || canSanction || canRevert ? (
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      {canCancel ? (
                        <Button size="sm" variant="outline" onClick={() => setPending({ action: "cancel", reservation })}>
                          <CalendarX2 className="mr-1.5 h-3.5 w-3.5" />
                          Cancelar apartado
                        </Button>
                      ) : null}
                      {canSanction ? (
                        <Button size="sm" variant="destructive" onClick={() => setPending({ action: "sanction", reservation })}>
                          <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                          Sancionar equipo
                        </Button>
                      ) : null}
                      {canRevert ? (
                        <Button size="sm" variant="outline" onClick={() => setPending({ action: "revert", reservation })}>
                          <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                          Revertir sanción
                        </Button>
                      ) : null}
                      {canRemove ? (
                        <Button size="sm" variant="outline" onClick={() => setPending({ action: "remove", reservation })}>
                          Eliminar
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pending}
        title={pending ? ACTIONS[pending.action].title : ""}
        description={pending ? ACTIONS[pending.action].description : ""}
        confirmLabel={pending ? ACTIONS[pending.action].label : ""}
        destructive={pending?.action !== "revert"}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!busy && pending) run(pending.action, pending.reservation);
        }}
      />
    </>
  );
}