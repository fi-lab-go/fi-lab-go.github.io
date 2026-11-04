import { dayName } from "@/lib/lab-constants";
import { downloadXlsx } from "@/lib/xlsx";

const HEADERS = [
  "Fecha",
  "Día",
  "Bloque",
  "Materia",
  "Práctica",
  "PLC",
  "MPS",
  "Equipo",
  "Integrantes",
  "Solicitó",
  "Matrícula",
  "Estado",
];

const WIDTHS = [12, 11, 15, 16, 24, 10, 16, 12, 36, 28, 13, 12];

export function downloadReservationsXlsx(items, filenameBase) {
  const rows = items.map((item) => [
    item.date,
    dayName(item.date),
    item.block,
    item.subject,
    item.practice,
    item.plc,
    item.mps,
    item.team,
    item.members,
    item.booker,
    item.matricula,
    item.status,
  ]);
  downloadXlsx(`${filenameBase}.xlsx`, "Reservas", HEADERS, rows, WIDTHS);
}