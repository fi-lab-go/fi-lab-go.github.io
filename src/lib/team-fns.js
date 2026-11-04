import { rpc } from "@/lib/supabase";

// Misma firma que tenían las funciones del servidor: fn({ data }) → { ok, ... }
export const getStudentTeams = ({ data }) => rpc("get_student_teams", data);
export const createTeam = ({ data }) => rpc("create_team", data);
