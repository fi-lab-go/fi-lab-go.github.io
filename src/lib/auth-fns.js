import { invokeFunction, rpc } from "@/lib/supabase";

// Misma firma que tenían las funciones del servidor: fn({ data }) → { ok, ... }
export const registerStudent = ({ data }) => rpc("register_student", data);
export const loginStudent = ({ data }) => rpc("login_student", data);
export const loginAdmin = ({ data }) => rpc("login_admin", data);
export const sessionInfo = ({ data }) => rpc("session_info", data);
export const logout = ({ data }) => rpc("logout", data);
export const updateStudentProfile = ({ data }) => rpc("update_student_profile", data);
export const updateAdminProfile = ({ data }) => rpc("update_admin_profile", data);
export const resetPassword = ({ data }) => rpc("reset_password", data);

const GENERIC = {
  ok: true,
  message: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.",
};

// El correo lo envía una Edge Function (supabase/functions/request-reset).
// Por seguridad la respuesta es siempre la misma, exista o no la cuenta.
export const requestPasswordReset = async ({ data }) => {
  try {
    await invokeFunction("request-reset", { email: data.email });
  } catch {
    // no revelamos si falló el envío
  }
  return GENERIC;
};
