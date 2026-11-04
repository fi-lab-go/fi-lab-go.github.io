// Cliente mínimo de Supabase (solo fetch, sin dependencias).
// Toda la lógica del laboratorio vive en funciones SQL (supabase/schema.sql);
// aquí solo se llaman por HTTP con la clave pública (anon / publishable).

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function headers() {
  const h = { "Content-Type": "application/json", apikey: KEY };
  // Las claves nuevas ("sb_publishable_…") no son JWT y solo van en `apikey`.
  if (KEY.startsWith("eyJ")) h.Authorization = `Bearer ${KEY}`;
  return h;
}

function assertConfigured() {
  if (!URL_BASE || !KEY) {
    throw new Error("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver README).");
  }
}

// Llama a una función SQL pública: devuelve el JSON { ok, ... } tal cual.
export async function rpc(name, data) {
  assertConfigured();
  const response = await fetch(`${URL_BASE}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p: data ?? {} }),
  });
  if (!response.ok) throw new Error(`Error ${response.status} al llamar ${name}`);
  return response.json();
}

// Llama a una Edge Function (solo se usa para el correo de recuperación).
export async function invokeFunction(name, body) {
  assertConfigured();
  const response = await fetch(`${URL_BASE}/functions/v1/${name}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(`Error ${response.status} al llamar ${name}`);
  return response.json();
}
