// Edge Function: envía el correo de "Restablecer contraseña".
// La crea y la despliega el README (paso 5). Es opcional: sin ella, todo lo
// demás funciona; solo no llegarán los correos de recuperación.
//
// Secretos necesarios (supabase secrets set ...):
//   SITE_URL        https://TU-USUARIO.github.io/TU-REPO      (sin "/" al final)
//   RESEND_API_KEY  clave de https://resend.com (plan gratis)
//   RESEND_FROM     "Laboratorio <avisos@tu-dominio.com>"      (opcional)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = () =>
  new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    const { email } = await req.json();
    const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (typeof email !== "string" || email.length > 200 || !siteUrl || !resendKey) return reply();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await admin.rpc("lab_create_reset_token", { p_email: email });
    if (!data?.found) return reply();

    // El enlace usa SIEMPRE SITE_URL (nunca un valor enviado por el navegador).
    const link = `${siteUrl}/#/restablecer?token=${data.token}`;
    const name = escapeHtml(String(data.name ?? ""));
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "Laboratorio <onboarding@resend.dev>",
        to: [email.trim().toLowerCase()],
        subject: "Restablecer contraseña · Laboratorio",
        text: `Hola ${data.name}, para restablecer tu contraseña entra a: ${link}\n\nEl enlace vence en 60 minutos.`,
        html: `<p>Hola ${name},</p><p>Para restablecer tu contraseña entra a este enlace:</p><p><a href="${link}">${link}</a></p><p>El enlace vence en 60 minutos. Si no solicitaste el cambio, ignora este correo.</p>`,
      }),
    });
  } catch {
    // no revelamos nada al navegador
  }
  return reply();
});
