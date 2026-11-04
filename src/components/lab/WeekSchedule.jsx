import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReservationChip from "@/components/lab/ReservationChip";
import { BLOCKS, SUBJECTS, SUBJECT_STYLES, addDays, dayNumber, dayShort, monthYearLabel, TOTAL_DAY_CAPACITY } from "@/lib/lab-constants";
import { cn } from "@/lib/utils";

export default function WeekSchedule({ days, monday, today, reservations, bookable = [], onBook, onDetails, onWeekChange }) {
  const isBookable = (date) => bookable.includes(date);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Horario del laboratorio</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold">{monthYearLabel(days[0] || today)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 rounded-full border bg-card px-3 py-1.5 md:flex">
            {SUBJECTS.map((subject) => (
              <span key={subject} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", SUBJECT_STYLES[subject].dot)} />
                {subject}
              </span>
            ))}
          </div>
          <Button variant="outline" size="icon" aria-label="Semana anterior" onClick={() => onWeekChange(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onWeekChange(0)}>
            Esta semana
          </Button>
          <Button variant="outline" size="icon" aria-label="Semana siguiente" onClick={() => onWeekChange(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <th className="w-[132px] border-b border-r border-border/80 bg-muted/40 p-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Hora
              </th>
              {days.map((date) => (
                <th
                  key={date}
                  className={cn(
                    "border-b border-r border-border/80 p-3 text-center",
                    date === today ? "bg-primary/5" : "bg-muted/20",
                  )}
                >
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {dayShort(date)}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 font-heading text-sm font-semibold",
                      date === today ? "bg-primary text-primary-foreground" : "text-foreground",
                    )}
                  >
                    {dayNumber(date)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((block) => (
              <tr key={block.index}>
                <th className="border-b border-r border-border/80 bg-muted/20 p-3 text-left text-[11px] font-medium text-muted-foreground">
                  {block.label}
                </th>
                {days.map((date) => {
                  const cellItems = reservations
                    .filter((r) => r.date === date && r.block === block.index)
                    .sort((a, b) => a.subject.localeCompare(b.subject));
                  const canBook = isBookable(date) && cellItems.length < TOTAL_DAY_CAPACITY;
                  return (
                    <td key={`${date}-${block.index}`} className="border-b border-r border-border/60 p-1.5 align-top">
                      <div className="min-h-[92px] space-y-1">
                        {cellItems.slice(0, 2).map((reservation) => (
                          <ReservationChip
                            key={reservation.id}
                            reservation={reservation}
                            onSelect={() => onDetails?.({ date, block: block.index })}
                          />
                        ))}
                        {cellItems.length > 2 ? (
                          <button
                            type="button"
                            onClick={() => onDetails?.({ date, block: block.index })}
                            className="w-full rounded-md px-1 py-0.5 text-[10px] font-semibold text-primary hover:underline"
                          >
                            Mostrar más ({cellItems.length})
                          </button>
                        ) : null}
                        {canBook ? (
                          <button
                            type="button"
                            onClick={() => onBook?.({ date, block: block.index })}
                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                          >
                            <Plus className="h-3 w-3" />
                            Apartar
                          </button>
                        ) : null}
                        {!cellItems.length && !canBook ? <div className="min-h-[60px]" /> : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Semana del {dayShort(monday)} {dayNumber(monday)} al {dayShort(addDays(monday, 4))} {dayNumber(addDays(monday, 4))}. Cada
        bloque dura 2 horas y el laboratorio abre de 8:00 a 20:00.
      </p>
    </section>
  );
}