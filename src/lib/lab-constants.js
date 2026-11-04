// Reglas y catálogos compartidos entre el navegador y el servidor.

export const SUBJECTS = ["Automatización", "CNC", "APM"];

export const PRACTICES = {
  "Automatización": ["Neumática/Electroneumática", "PLC", "MPS"],
  "CNC": ["Máquina CNC"],
  "APM": ["MPS", "Brazo Robot"],
};

// Cupos por materia y práctica dentro de un mismo bloque de horario.
export const CAPACITY = {
  "Automatización": { "Neumática/Electroneumática": 1, "PLC": 2, "MPS": 1 },
  "CNC": { "Máquina CNC": 1 },
  "APM": { "MPS": 2, "Brazo Robot": 1 },
};

export const PLC_OPTIONS = ["PLC 1", "PLC 2", "PLC 3", "PLC 4"];
export const MPS_OPTIONS = ["MPS Sorting", "MPS Processing", "MPS Distributing", "MPS Handling"];

export const BLOCKS = [
  { index: 0, label: "8:00 – 10:00", start: 8, end: 10 },
  { index: 1, label: "10:00 – 12:00", start: 10, end: 12 },
  { index: 2, label: "12:00 – 14:00", start: 12, end: 14 },
  { index: 3, label: "14:00 – 16:00", start: 14, end: 16 },
  { index: 4, label: "16:00 – 18:00", start: 16, end: 18 },
  { index: 5, label: "18:00 – 20:00", start: 18, end: 20 },
];

export const TOTAL_DAY_CAPACITY = BLOCKS.length * 8;
export const SANCTION_GRACE_MIN = 15;
export const SANCTION_WINDOW_MIN = 30;
export const REVERT_WINDOW_MIN = 15;

export const SUBJECT_STYLES = {
  "Automatización": {
    chip: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  "CNC": {
    chip: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  "APM": {
    chip: "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
    dot: "bg-teal-500",
    bar: "bg-teal-500",
  },
};

export const TZ = "America/Mexico_City";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const pad = (n) => String(n).padStart(2, "0");

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fmtDate(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(dateStr, n) {
  return fmtDate(parseDate(dateStr) + n * 86400000);
}

// 0 = domingo … 6 = sábado
export function weekdayOf(dateStr) {
  return new Date(parseDate(dateStr)).getUTCDay();
}

export function dayName(dateStr) {
  return DAYS[weekdayOf(dateStr)];
}

export function dayShort(dateStr) {
  return DAYS[weekdayOf(dateStr)].slice(0, 3);
}

export function dayNumber(dateStr) {
  return dateStr.split("-")[2];
}

export function monthYearLabel(dateStr) {
  const [y, m] = dateStr.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function weekMondayOf(dateStr) {
  const wd = weekdayOf(dateStr);
  return addDays(dateStr, -((wd + 6) % 7));
}

export function nextSchoolDay(dateStr) {
  let cursor = addDays(dateStr, 1);
  while ([0, 6].includes(weekdayOf(cursor))) cursor = addDays(cursor, 1);
  return cursor;
}

export function todayInTz(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function minutesInTz(now = new Date()) {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function blockStartMinutes(blockIndex) {
  return (BLOCKS[blockIndex]?.start ?? 0) * 60;
}

export function windowOpen(enabled, start, end, today) {
  if (!enabled) return false;
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

export function needsPlc(practice) {
  return practice === "PLC" || practice === "MPS";
}

export function needsMps(practice) {
  return practice === "MPS";
}

export function teamDisplay(team) {
  if (!team) return "";
  if (team.has_number && team.team_number) return `Equipo ${team.team_number}`;
  return team.booker_name || "";
}