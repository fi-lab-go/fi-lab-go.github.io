import { rpc } from "@/lib/supabase";

// Misma firma que tenían las funciones del servidor: fn({ data }) → { ok, ... }
export const adminReservationsReport = ({ data }) => rpc("admin_reservations_report", data);
