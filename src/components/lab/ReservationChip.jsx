import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SUBJECT_STYLES } from "@/lib/lab-constants";
import { cn } from "@/lib/utils";

export default function ReservationChip({ reservation, onSelect }) {
  const style = SUBJECT_STYLES[reservation.subject] || SUBJECT_STYLES["CNC"];
  const teamLabel =
    reservation.has_number && reservation.team_number
      ? `Equipo ${reservation.team_number}`
      : reservation.booker_name || "Equipo sin número";

  return (
    <HoverCard openDelay={100} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect?.(reservation)}
          className={cn(
            "w-full rounded-lg border px-2 py-1.5 text-left transition-colors",
            style.chip,
          )}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold leading-tight">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
            <span className="truncate">{reservation.subject}</span>
          </span>
          <span className="block truncate text-[10px] leading-tight opacity-75">{reservation.practice}</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 text-xs" side="right">
        <p className="mb-2 font-heading text-sm font-semibold">{reservation.subject}</p>
        <dl className="space-y-1 text-muted-foreground">
          <div className="flex justify-between gap-2">
            <dt>Práctica</dt>
            <dd className="text-right font-medium text-foreground">{reservation.practice}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Equipo</dt>
            <dd className="text-right font-medium text-foreground">{teamLabel}</dd>
          </div>
          {reservation.plc ? (
            <div className="flex justify-between gap-2">
              <dt>PLC</dt>
              <dd className="text-right font-medium text-foreground">{reservation.plc}</dd>
            </div>
          ) : null}
          {reservation.mps ? (
            <div className="flex justify-between gap-2">
              <dt>MPS</dt>
              <dd className="text-right font-medium text-foreground">{reservation.mps}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt>Apartó</dt>
            <dd className="text-right font-medium text-foreground">{reservation.booker_name}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Integrantes</dt>
            <dd className="text-right font-medium text-foreground">{reservation.team_members?.length || 0}</dd>
          </div>
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}