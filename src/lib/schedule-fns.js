import { rpc } from "@/lib/supabase";

// Misma firma que tenían las funciones del servidor: fn({ data }) → { ok, ... }
export const getSchedule = ({ data }) => rpc("get_schedule", data);
export const acquireSlot = ({ data }) => rpc("acquire_slot", data);
export const releaseSlot = ({ data }) => rpc("release_slot", data);
export const createReservation = ({ data }) => rpc("create_reservation", data);
export const cancelReservation = ({ data }) => rpc("cancel_reservation", data);
export const adminDeleteReservation = ({ data }) => rpc("admin_delete_reservation", data);
export const sanctionReservation = ({ data }) => rpc("sanction_reservation", data);
export const revertSanction = ({ data }) => rpc("revert_sanction", data);
