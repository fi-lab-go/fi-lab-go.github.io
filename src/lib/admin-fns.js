import { rpc } from "@/lib/supabase";

// Misma firma que tenían las funciones del servidor: fn({ data }) → { ok, ... }
export const adminListStudents = ({ data }) => rpc("admin_list_students", data);
export const adminUpdateStudent = ({ data }) => rpc("admin_update_student", data);
export const adminDeleteStudent = ({ data }) => rpc("admin_delete_student", data);
export const adminListTeams = ({ data }) => rpc("admin_list_teams", data);
export const adminUpdateTeam = ({ data }) => rpc("admin_update_team", data);
export const adminDeleteTeam = ({ data }) => rpc("admin_delete_team", data);
export const adminDeleteAllTeams = ({ data }) => rpc("admin_delete_all_teams", data);
export const adminListAdmins = ({ data }) => rpc("admin_list_admins", data);
export const adminCreateAdmin = ({ data }) => rpc("admin_create_admin", data);
export const adminGetSettings = ({ data }) => rpc("admin_get_settings", data);
export const adminUpdateSettings = ({ data }) => rpc("admin_update_settings", data);
export const publicConfig = ({ data }) => rpc("public_config", data);
