import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Loader2 } from "lucide-react";
import BookingDialog from "@/components/lab/BookingDialog";
import SlotDetailsDialog from "@/components/lab/SlotDetailsDialog";
import WeekSchedule from "@/components/lab/WeekSchedule";
import { useLabUser } from "@/components/lab/LabShell";
import { getSchedule } from "@/lib/schedule-fns";
import { addDays, dayName, dayNumber, monthYearLabel, todayInTz, weekMondayOf } from "@/lib/lab-constants";

export default function SchedulePage() {
  const { token, role } = useLabUser();
  const [weekStart, setWeekStart] = useState(() => weekMondayOf(todayInTz()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [detailsSlot, setDetailsSlot] = useState(null);

  const load = useCallback(
    async (start) => {
      setLoading(true);
      try {
        const res = await getSchedule({ data: { token, weekStart: start } });
        if (res.ok) setData(res);
      } catch {
        setData(null);
      }
      setLoading(false);
    },
    [token],
  );

  useEffect(() => {
    load(weekStart);
  }, [weekStart, load]);

  const handleWeekChange = (delta) => {
    if (delta === 0) setWeekStart(weekMondayOf(todayInTz()));
    else setWeekStart(addDays(data?.monday || weekMondayOf(todayInTz()), delta * 7));
  };

  const refresh = () => load(weekStart);

  const sanctioned = (data?.myTeams || []).filter((team) => team.sanctioned);
  const bookable = data?.bookable || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {role === "admin" ? "Panel del maestro" : "Mi horario"}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Laboratorio</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {role === "admin"
              ? "Consulta los horarios apartados, elimina apartados del día y aplica sanciones dentro de la ventana permitida."
              : "Elige el día y la hora para apartar tu espacio. Solo puedes apartar con un día de anticipación."}
          </p>
        </div>
        {role === "student" && bookable.length ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs text-primary">
            <CalendarClock className="mr-1.5 inline h-3.5 w-3.5" />
            Puedes apartar para el {dayName(bookable[0])} {dayNumber(bookable[0])} de {monthYearLabel(bookable[0])}
            {bookable[1] ? ` o, si ese día se llena, para el ${dayName(bookable[1])} ${dayNumber(bookable[1])}` : ""}
          </div>
        ) : null}
      </div>

      {role === "student" && !data?.myTeams?.length && !loading ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>Todavía no perteneces a ningún equipo. Necesitas un equipo para poder apartar horario.</p>
          <Link to="/estudiante/equipo" className="font-semibold underline">
            Crear mi equipo
          </Link>
        </div>
      ) : null}

      {sanctioned.length ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Equipo sancionado en {sanctioned.map((team) => team.subject).join(", ")} hasta el{" "}
            {sanctioned[0].sanctioned_until}. No podrás apartar horario de esa materia hasta que termine la sanción.
          </p>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : null}

      {data ? (
        <WeekSchedule
          days={data.days}
          monday={data.monday}
          today={data.today}
          reservations={data.reservations}
          bookable={bookable}
          onBook={role === "student" ? (slot) => setBookingSlot(slot) : undefined}
          onDetails={(slot) => setDetailsSlot(slot)}
          onWeekChange={handleWeekChange}
        />
      ) : null}

      <BookingDialog
        open={!!bookingSlot}
        onClose={() => setBookingSlot(null)}
        slot={bookingSlot}
        myTeams={data?.myTeams || []}
        reservations={data?.reservations || []}
        token={token}
        onDone={refresh}
      />

      <SlotDetailsDialog
        open={!!detailsSlot}
        onClose={() => setDetailsSlot(null)}
        slot={detailsSlot}
        reservations={data?.reservations || []}
        role={role}
        token={token}
        myTeamIds={(data?.myTeams || []).map((team) => team.id)}
        onDone={refresh}
      />
    </div>
  );
}