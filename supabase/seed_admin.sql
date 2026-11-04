-- =====================================================================
--  Crea el primer administrador (maestro). Ejecútalo UNA vez en el
--  SQL Editor de Supabase DESPUÉS de schema.sql.
--  ⚠️ Cambia usuario, correo y contraseña ANTES de ejecutarlo.
--  Luego entra con ese usuario desde la pestaña "Maestro" y, desde
--  "Agregar Administrador", puedes crear los demás.
-- =====================================================================
insert into admins (username, first_name, last_name, email, password_hash)
values (
  'admin',                     -- usuario
  'Administrador',             -- nombre
  'Laboratorio',               -- apellido
  'admin@ejemplo.com',         -- correo (sirve para recuperar contraseña)
  extensions.crypt('CAMBIA-ESTA-CONTRASEÑA', extensions.gen_salt('bf'))   -- contraseña
);
