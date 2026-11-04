-- =====================================================================
--  Laboratorio de Automatización · Esquema de base de datos (Supabase)
--  Ejecuta TODO este archivo una sola vez en: Supabase → SQL Editor.
--  Es la réplica fiel de la lógica que antes vivía en el servidor de Base44.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
--  Tablas (ninguna es accesible directamente desde el navegador:
--  RLS activado y sin políticas; todo pasa por las funciones de abajo)
-- ---------------------------------------------------------------------

create table if not exists app_config (
  id int primary key default 1 check (id = 1),
  registration_enabled boolean not null default false,
  registration_start text not null default '',
  registration_end text not null default '',
  teams_enabled boolean not null default false,
  teams_start text not null default '',
  teams_end text not null default '',
  ip_restriction_enabled boolean not null default true,
  allowed_ips text not null default '10.4.26.250, 10.0.98.40'
);
insert into app_config (id) values (1) on conflict (id) do nothing;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  matricula text not null unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists admins_username_lower on admins (lower(username));

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('Automatización', 'CNC', 'APM')),
  team_number text not null default '',
  has_number boolean not null default true,
  members text[] not null default '{}',
  owner_matricula text not null,
  sanctioned_until text not null default '',
  sanction_reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_date date not null,
  block int not null check (block between 0 and 5),
  subject text not null,
  practice text not null,
  plc text not null default '',
  mps text not null default '',
  team_id uuid not null,
  booker_matricula text not null default '',
  booker_name text not null default '',
  status text not null default 'active' check (status in ('active', 'cancelled', 'no_show', 'attended')),
  sanctioned_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reservations_date_idx on reservations (reservation_date, status);
create index if not exists reservations_team_idx on reservations (team_id);

create table if not exists session_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  kind text not null default 'session' check (kind in ('session', 'reset')),
  role text not null default 'student' check (role in ('student', 'admin')),
  user_id uuid not null,
  expires_at timestamptz not null
);
create index if not exists session_tokens_hash_idx on session_tokens (token_hash);

create table if not exists slot_locks (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null,
  holder_token text not null,
  holder_name text not null default '',
  expires_at timestamptz not null
);
create index if not exists slot_locks_key_idx on slot_locks (slot_key);

alter table app_config enable row level security;
alter table students enable row level security;
alter table admins enable row level security;
alter table teams enable row level security;
alter table reservations enable row level security;
alter table session_tokens enable row level security;
alter table slot_locks enable row level security;

revoke all on app_config, students, admins, teams, reservations, session_tokens, slot_locks from anon, authenticated;

-- ---------------------------------------------------------------------
--  Utilidades internas (prefijo lab_)
-- ---------------------------------------------------------------------

create or replace function lab_today() returns date
language sql stable as $$ select (now() at time zone 'America/Mexico_City')::date $$;

create or replace function lab_minutes() returns int
language sql stable as $$
  select (extract(hour from now() at time zone 'America/Mexico_City') * 60
        + extract(minute from now() at time zone 'America/Mexico_City'))::int
$$;

create or replace function lab_ok(extra jsonb default '{}'::jsonb) returns jsonb
language sql immutable as $$ select jsonb_build_object('ok', true) || coalesce(extra, '{}'::jsonb) $$;

create or replace function lab_fail(msg text) returns jsonb
language sql immutable as $$ select jsonb_build_object('ok', false, 'error', msg) $$;

create or replace function lab_d(d date) returns text
language sql immutable as $$ select to_char(d, 'YYYY-MM-DD') $$;

create or replace function lab_valid_email(e text) returns boolean
language sql immutable as $$ select coalesce(e, '') ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' $$;

-- Reglas del laboratorio (mismas que lab-constants.js)
create or replace function lab_practices() returns jsonb
language sql immutable as $$
  select '{"Automatización":["Neumática/Electroneumática","PLC","MPS"],"CNC":["Máquina CNC"],"APM":["MPS","Brazo Robot"]}'::jsonb
$$;

create or replace function lab_capacity() returns jsonb
language sql immutable as $$
  select '{"Automatización":{"Neumática/Electroneumática":1,"PLC":2,"MPS":1},"CNC":{"Máquina CNC":1},"APM":{"MPS":2,"Brazo Robot":1}}'::jsonb
$$;

create or replace function lab_block_label(b int) returns text
language sql immutable as $$ select (8 + 2 * b) || ':00 – ' || (10 + 2 * b) || ':00' $$;

-- Sesión vigente a partir del token que guarda el navegador.
create or replace function lab_session(p_token text, p_kind text default 'session')
returns session_tokens
language sql stable security definer set search_path = public, extensions as $$
  select * from session_tokens
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and kind = p_kind and expires_at > now()
  limit 1
$$;

create or replace function lab_new_token(p_kind text, p_role text, p_user uuid, p_minutes int default null)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text := encode(gen_random_bytes(32), 'hex');
begin
  delete from session_tokens where expires_at <= now();
  insert into session_tokens (token_hash, kind, role, user_id, expires_at)
  values (encode(digest(t, 'sha256'), 'hex'), p_kind, p_role, p_user,
          now() + coalesce(p_minutes * interval '1 minute', interval '7 days'));
  return t;
end $$;

-- IP del visitante (la fija la puerta de enlace de Supabase en las cabeceras).
create or replace function lab_request_ip() returns text
language plpgsql stable as $$
declare h json; ip text;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    return '';
  end;
  if h is null then return ''; end if;
  ip := coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(h->>'x-real-ip', ''),
                 split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1));
  ip := trim(coalesce(ip, ''));
  if ip like '::ffff:%' then ip := substr(ip, 8); end if;
  return ip;
end $$;

-- Días que un estudiante puede apartar: el siguiente día hábil y, si ya se
-- llenó por completo (48 cupos), el siguiente.
create or replace function lab_bookable(p_today date) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare d1 date := p_today + 1; d2 date; r jsonb;
begin
  while extract(isodow from d1) >= 6 loop d1 := d1 + 1; end loop;
  r := jsonb_build_array(lab_d(d1));
  if (select count(*) from reservations where status = 'active' and reservation_date = d1) >= 48 then
    d2 := d1 + 1;
    while extract(isodow from d2) >= 6 loop d2 := d2 + 1; end loop;
    r := r || to_jsonb(lab_d(d2));
  end if;
  return r;
end $$;

create or replace function lab_public_student(s students) returns jsonb
language sql immutable as $$
  select jsonb_build_object('id', s.id, 'matricula', s.matricula, 'first_name', s.first_name,
                            'last_name', s.last_name, 'email', s.email)
$$;

create or replace function lab_public_admin(a admins) returns jsonb
language sql immutable as $$
  select jsonb_build_object('id', a.id, 'username', a.username, 'first_name', a.first_name,
                            'last_name', a.last_name, 'email', a.email)
$$;

-- Crea el token de recuperación. Solo la usa la Edge Function (service_role).
create or replace function lab_create_reset_token(p_email text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare e text := lower(trim(coalesce(p_email, ''))); s students; a admins; t text;
begin
  select * into s from students where lower(email) = e limit 1;
  if s.id is not null then
    t := lab_new_token('reset', 'student', s.id, 60);
    return jsonb_build_object('found', true, 'token', t, 'name', s.first_name);
  end if;
  select * into a from admins where lower(email) = e limit 1;
  if a.id is not null then
    t := lab_new_token('reset', 'admin', a.id, 60);
    return jsonb_build_object('found', true, 'token', t, 'name', a.first_name);
  end if;
  return jsonb_build_object('found', false);
end $$;

-- ---------------------------------------------------------------------
--  Autenticación
-- ---------------------------------------------------------------------

create or replace function public_config(p jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare c app_config;
begin
  select * into c from app_config where id = 1;
  return lab_ok(jsonb_build_object(
    'registrationEnabled', c.registration_enabled,
    'registrationStart', c.registration_start,
    'registrationEnd', c.registration_end,
    'subjects', jsonb_build_array('Automatización', 'CNC', 'APM')));
end $$;

create or replace function register_student(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare c app_config; today text := lab_d(lab_today());
        mat text := trim(coalesce(p->>'matricula', ''));
        fn text := trim(coalesce(p->>'firstName', ''));
        ln text := trim(coalesce(p->>'lastName', ''));
        em text := trim(coalesce(p->>'email', ''));
        pw text := coalesce(p->>'password', '');
begin
  select * into c from app_config where id = 1;
  if not (c.registration_enabled
          and (c.registration_start = '' or today >= c.registration_start)
          and (c.registration_end = '' or today <= c.registration_end)) then
    return lab_fail('El registro de estudiantes está cerrado en este momento. Consulta con tu maestro.');
  end if;
  if mat !~ '^\d{8}$' then return lab_fail('La matrícula debe tener exactamente 8 dígitos.'); end if;
  if fn = '' or ln = '' then return lab_fail('Escribe tu nombre y apellido.'); end if;
  if not lab_valid_email(em) then return lab_fail('Escribe un correo válido.'); end if;
  if length(pw) < 6 then return lab_fail('La contraseña debe tener al menos 6 caracteres.'); end if;
  if length(fn) > 80 or length(ln) > 80 or length(em) > 200 or length(pw) > 200 then
    return lab_fail('Alguno de los datos es demasiado largo.');
  end if;
  if exists (select 1 from students where matricula = mat) then
    return lab_fail('Ya existe una cuenta con esa matrícula.');
  end if;
  insert into students (matricula, first_name, last_name, email, password_hash)
  values (mat, fn, ln, lower(em), crypt(pw, gen_salt('bf')));
  return lab_ok();
end $$;

create or replace function login_student(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s students; c app_config; ip text; allowed text[]; t text;
begin
  select * into s from students where matricula = trim(coalesce(p->>'matricula', ''));
  if s.id is null or s.password_hash <> crypt(coalesce(p->>'password', ''), s.password_hash) then
    return lab_fail('Matrícula o contraseña incorrecta.');
  end if;
  select * into c from app_config where id = 1;
  allowed := array(select x from regexp_split_to_table(coalesce(c.allowed_ips, ''), '[,\s]+') x where x <> '');
  ip := lab_request_ip();
  if c.ip_restriction_enabled and coalesce(array_length(allowed, 1), 0) > 0 and not (ip = any(allowed)) then
    return lab_fail('Solo puedes iniciar sesión desde las redes del laboratorio (' || array_to_string(allowed, ', ')
                    || '). Tu red actual es ' || coalesce(nullif(ip, ''), 'desconocida') || '.');
  end if;
  t := lab_new_token('session', 'student', s.id);
  return lab_ok(jsonb_build_object('token', t, 'role', 'student', 'user', lab_public_student(s)));
end $$;

create or replace function login_admin(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a admins; v text := lower(trim(coalesce(p->>'username', ''))); t text;
begin
  select * into a from admins where lower(username) = v or lower(email) = v limit 1;
  if a.id is null or a.password_hash <> crypt(coalesce(p->>'password', ''), a.password_hash) then
    return lab_fail('Usuario o contraseña incorrecta.');
  end if;
  t := lab_new_token('session', 'admin', a.id);
  return lab_ok(jsonb_build_object('token', t, 'role', 'admin', 'user', lab_public_admin(a)));
end $$;

create or replace function session_info(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; ad admins;
begin
  s := lab_session(p->>'token');
  if s.id is null then return lab_fail('Sesión expirada.'); end if;
  if s.role = 'admin' then
    select * into ad from admins where id = s.user_id;
    if ad.id is null then return lab_fail('Sesión expirada.'); end if;
    return lab_ok(jsonb_build_object('role', 'admin', 'user', lab_public_admin(ad)));
  end if;
  select * into st from students where id = s.user_id;
  if st.id is null then return lab_fail('Sesión expirada.'); end if;
  return lab_ok(jsonb_build_object('role', 'student', 'user', lab_public_student(st)));
end $$;

create or replace function logout(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens;
begin
  s := lab_session(p->>'token');
  if s.id is not null then delete from session_tokens where id = s.id; end if;
  return lab_ok();
end $$;

create or replace function update_student_profile(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; em text := lower(trim(coalesce(p->>'email', '')));
        np text := coalesce(p->>'newPassword', ''); cp text := coalesce(p->>'currentPassword', '');
        changed boolean := false;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'student' then return lab_fail('Sesión no válida.'); end if;
  select * into st from students where id = s.user_id;
  if st.id is null then return lab_fail('Cuenta no encontrada.'); end if;

  if em <> '' and em <> st.email then
    if not lab_valid_email(em) then return lab_fail('Escribe un correo válido.'); end if;
    update students set email = em where id = st.id;
    changed := true;
  end if;
  if np <> '' then
    if length(np) < 6 then return lab_fail('La nueva contraseña debe tener al menos 6 caracteres.'); end if;
    if cp = '' then return lab_fail('Escribe tu contraseña actual.'); end if;
    if st.password_hash <> crypt(cp, st.password_hash) then return lab_fail('Tu contraseña actual no es correcta.'); end if;
    update students set password_hash = crypt(np, gen_salt('bf')) where id = st.id;
    changed := true;
  end if;
  if not changed then return lab_fail('No hay cambios por guardar.'); end if;
  return lab_ok();
end $$;

create or replace function update_admin_profile(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; ad admins; un text := trim(coalesce(p->>'username', ''));
        em text := trim(coalesce(p->>'email', ''));
        np text := coalesce(p->>'newPassword', ''); cp text := coalesce(p->>'currentPassword', '');
        hash text;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'admin' then return lab_fail('Sesión no válida.'); end if;
  select * into ad from admins where id = s.user_id;
  if ad.id is null then return lab_fail('Cuenta no encontrada.'); end if;
  if un = '' then return lab_fail('El usuario no puede quedar vacío.'); end if;
  if exists (select 1 from admins where id <> ad.id and lower(username) = lower(un)) then
    return lab_fail('Ese usuario ya está en uso.');
  end if;
  if not lab_valid_email(em) then return lab_fail('Escribe un correo válido.'); end if;

  hash := ad.password_hash;
  if np <> '' then
    if length(np) < 6 then return lab_fail('La nueva contraseña debe tener al menos 6 caracteres.'); end if;
    if cp = '' then return lab_fail('Escribe tu contraseña actual.'); end if;
    if ad.password_hash <> crypt(cp, ad.password_hash) then return lab_fail('Tu contraseña actual no es correcta.'); end if;
    hash := crypt(np, gen_salt('bf'));
  end if;
  update admins set username = un, first_name = trim(coalesce(p->>'firstName', '')),
         last_name = trim(coalesce(p->>'lastName', '')), email = lower(em), password_hash = hash
   where id = ad.id returning * into ad;
  return lab_ok(jsonb_build_object('user', lab_public_admin(ad)));
end $$;

create or replace function reset_password(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; pw text := coalesce(p->>'password', '');
begin
  if length(pw) < 6 then return lab_fail('La contraseña debe tener al menos 6 caracteres.'); end if;
  s := lab_session(p->>'token', 'reset');
  if s.id is null then return lab_fail('El enlace no es válido o ya venció. Solicita uno nuevo.'); end if;
  if s.role = 'admin' then
    update admins set password_hash = crypt(pw, gen_salt('bf')) where id = s.user_id;
  else
    update students set password_hash = crypt(pw, gen_salt('bf')) where id = s.user_id;
  end if;
  delete from session_tokens where id = s.id;
  return lab_ok();
end $$;

-- ---------------------------------------------------------------------
--  Horario y reservas
-- ---------------------------------------------------------------------

create or replace function get_schedule(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; today date := lab_today(); nowm int := lab_minutes(); c app_config;
        ws text := p->>'weekStart'; monday date; days jsonb; res jsonb; st students;
        my jsonb := '[]'::jsonb; bk jsonb := '[]'::jsonb; stu jsonb := 'null'::jsonb;
begin
  s := lab_session(p->>'token');
  if s.id is null then return lab_fail('Sesión expirada.'); end if;
  select * into c from app_config where id = 1;

  begin
    monday := date_trunc('week', case when ws ~ '^\d{4}-\d{2}-\d{2}$' then ws::date else today end)::date;
  exception when others then
    monday := date_trunc('week', today)::date;
  end;
  select jsonb_agg(lab_d(monday + i) order by i) into days from generate_series(0, 4) i;

  -- Cierra los horarios ya pasados o cuyo margen de tolerancia terminó.
  update reservations set status = 'attended'
   where status = 'active'
     and (reservation_date < today
          or (reservation_date = today and nowm > (8 + 2 * block) * 60 + 30));

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'date', lab_d(r.reservation_date), 'block', r.block, 'subject', r.subject,
      'practice', r.practice, 'plc', r.plc, 'mps', r.mps, 'team_id', r.team_id,
      'team_number', coalesce(t.team_number, ''), 'has_number', coalesce(t.has_number, false),
      'team_members', to_jsonb(coalesce(t.members, '{}'::text[])),
      'sanctioned_until', coalesce(t.sanctioned_until, ''),
      'booker_name', r.booker_name, 'booker_matricula', r.booker_matricula,
      'sanctioned_at', coalesce(to_jsonb(r.sanctioned_at), '""'::jsonb),
      'created_today', (r.created_at at time zone 'America/Mexico_City')::date = today)
    order by r.reservation_date, r.block), '[]'::jsonb)
    into res
    from reservations r left join teams t on t.id = r.team_id
   where r.status = 'active' and r.reservation_date between monday and monday + 4;

  if s.role = 'student' then
    select * into st from students where id = s.user_id;
    if st.id is not null then
      select coalesce(jsonb_agg(jsonb_build_object(
          'id', t.id, 'subject', t.subject, 'team_number', t.team_number, 'has_number', t.has_number,
          'members', to_jsonb(t.members), 'sanctioned_until', t.sanctioned_until,
          'sanctioned', t.sanctioned_until <> '' and lab_d(today) <= t.sanctioned_until)
        order by t.created_at desc), '[]'::jsonb)
        into my from teams t where t.members @> array[st.matricula];
      stu := jsonb_build_object('matricula', st.matricula, 'first_name', st.first_name, 'last_name', st.last_name);
    end if;
    bk := lab_bookable(today);
  end if;

  return lab_ok(jsonb_build_object(
    'role', s.role, 'today', lab_d(today), 'nowMinutes', nowm, 'days', days, 'monday', lab_d(monday),
    'reservations', res, 'bookable', bk, 'myTeams', my, 'student', stu,
    'capacity', lab_capacity(), 'totalCapacity', 48, 'teamsWindowOpen', c.teams_enabled));
end $$;

create or replace function acquire_slot(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; k text; live slot_locks;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'student' then return lab_fail('Sesión no válida.'); end if;
  select * into st from students where id = s.user_id;
  if st.id is null then return lab_fail('Cuenta no encontrada.'); end if;

  k := (p->>'date') || '#' || (p->>'block');
  perform pg_advisory_xact_lock(hashtext('lab_slot_' || k));
  delete from slot_locks where slot_key = k and expires_at <= now();

  select * into live from slot_locks where slot_key = k and holder_token = s.user_id::text limit 1;
  if live.id is not null then
    update slot_locks set expires_at = now() + interval '5 minutes' where id = live.id;
    return lab_ok(jsonb_build_object('lockToken', s.user_id));
  end if;
  select * into live from slot_locks where slot_key = k limit 1;
  if live.id is not null then
    return lab_fail('Alguien más' || case when live.holder_name <> '' then ' (' || live.holder_name || ')' else '' end
                    || ' está apartando este horario. Espera a que termine o elige otro horario.');
  end if;
  insert into slot_locks (slot_key, holder_token, holder_name, expires_at)
  values (k, s.user_id::text, st.first_name || ' ' || st.last_name, now() + interval '5 minutes');
  return lab_ok(jsonb_build_object('lockToken', s.user_id));
end $$;

create or replace function release_slot(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens;
begin
  s := lab_session(p->>'token');
  if s.id is null then return lab_ok(); end if;
  delete from slot_locks where slot_key = (p->>'date') || '#' || (p->>'block') and holder_token = s.user_id::text;
  return lab_ok();
end $$;

create or replace function create_reservation(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; today date := lab_today(); d date; blk int; tm teams;
        subj text := p->>'subject'; prac text := p->>'practice';
        plc_v text := trim(coalesce(p->>'plc', '')); mps_v text := trim(coalesce(p->>'mps', ''));
        lim int; same int;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'student' then return lab_fail('Sesión no válida.'); end if;
  select * into st from students where id = s.user_id;
  if st.id is null then return lab_fail('Cuenta no encontrada.'); end if;

  begin
    d := (p->>'date')::date; blk := (p->>'block')::int;
  exception when others then
    return lab_fail('Horario no válido.');
  end;
  if blk is null or blk < 0 or blk > 5 then return lab_fail('Horario no válido.'); end if;

  perform pg_advisory_xact_lock(hashtext('lab_reservations'));

  if not (lab_bookable(today) @> to_jsonb(lab_d(d))) then
    return lab_fail('Ese día no está disponible para apartar. Solo puedes apartar con un día de anticipación.');
  end if;

  select * into tm from teams where subject = subj and members @> array[st.matricula] limit 1;
  if tm.id is null then return lab_fail('No tienes un equipo registrado en ' || coalesce(subj, '') || '.'); end if;
  if tm.sanctioned_until <> '' and lab_d(today) <= tm.sanctioned_until then
    return lab_fail('Tu equipo está sancionado en ' || subj || ' hasta el ' || tm.sanctioned_until || '.');
  end if;

  if exists (select 1 from reservations where status = 'active' and team_id = tm.id and reservation_date = d) then
    return lab_fail('Tu equipo ya tiene un horario apartado de esta materia ese día.');
  end if;

  if not (coalesce(lab_practices() -> subj, '[]'::jsonb) @> to_jsonb(prac)) then
    return lab_fail('Esa práctica no pertenece a la materia elegida.');
  end if;

  if prac not in ('PLC', 'MPS') then plc_v := ''; end if;
  if prac <> 'MPS' then mps_v := ''; end if;
  if prac in ('PLC', 'MPS') and plc_v not in ('PLC 1', 'PLC 2', 'PLC 3', 'PLC 4') then
    return lab_fail('Selecciona el PLC que van a utilizar.');
  end if;
  if prac = 'MPS' and mps_v not in ('MPS Sorting', 'MPS Processing', 'MPS Distributing', 'MPS Handling') then
    return lab_fail('Selecciona la MPS que van a utilizar.');
  end if;

  lim := coalesce((lab_capacity() -> subj ->> prac)::int, 1);
  select count(*) into same from reservations
   where status = 'active' and reservation_date = d and block = blk and subject = subj and practice = prac;
  if same >= lim then
    return lab_fail('Ya no hay cupo para ' || prac || ' de ' || subj || ' en ese horario.');
  end if;
  if prac = 'PLC' and exists (select 1 from reservations where status = 'active' and reservation_date = d
        and block = blk and subject = subj and practice = prac and plc = plc_v) then
    return lab_fail('El ' || plc_v || ' ya está ocupado en ese horario por otro equipo.');
  end if;
  if prac = 'MPS' and exists (select 1 from reservations where status = 'active' and reservation_date = d
        and block = blk and subject = subj and practice = prac and plc = plc_v and mps = mps_v) then
    return lab_fail('La ' || mps_v || ' con ' || plc_v || ' ya está ocupada en ese horario por otro equipo.');
  end if;

  insert into reservations (reservation_date, block, subject, practice, plc, mps, team_id,
                            booker_matricula, booker_name, status)
  values (d, blk, subj, prac, plc_v, mps_v, tm.id, st.matricula, st.first_name || ' ' || st.last_name, 'active');

  delete from slot_locks where slot_key = lab_d(d) || '#' || blk and holder_token = s.user_id::text;
  return lab_ok();
end $$;

create or replace function cancel_reservation(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; r reservations; tm teams; rid uuid;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'student' then return lab_fail('Sesión no válida.'); end if;
  select * into st from students where id = s.user_id;
  begin rid := (p->>'id')::uuid; exception when others then return lab_fail('Ese apartado ya no está activo.'); end;
  select * into r from reservations where id = rid;
  if r.id is null or r.status <> 'active' then return lab_fail('Ese apartado ya no está activo.'); end if;
  if (r.created_at at time zone 'America/Mexico_City')::date <> lab_today() then
    return lab_fail('Solo puedes cancelar el mismo día en que apartaste.');
  end if;
  select * into tm from teams where id = r.team_id;
  if tm.id is null or st.id is null or not (tm.members @> array[st.matricula]) then
    return lab_fail('No puedes cancelar este apartado.');
  end if;
  update reservations set status = 'cancelled' where id = r.id;
  return lab_ok();
end $$;

create or replace function admin_delete_reservation(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; r reservations; rid uuid;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'admin' then return lab_fail('Sesión no válida.'); end if;
  begin rid := (p->>'id')::uuid; exception when others then return lab_fail('El apartado ya no existe.'); end;
  select * into r from reservations where id = rid;
  if r.id is null then return lab_fail('El apartado ya no existe.'); end if;
  if r.reservation_date > lab_today() + 1 then
    return lab_fail('Solo puedes eliminar apartados del mismo día o de un día antes.');
  end if;
  update reservations set status = 'cancelled' where id = r.id;
  return lab_ok();
end $$;

create or replace function sanction_reservation(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; r reservations; rid uuid; start_m int; nowm int := lab_minutes(); until_d text;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'admin' then return lab_fail('Sesión no válida.'); end if;
  begin rid := (p->>'id')::uuid; exception when others then return lab_fail('El apartado ya no está activo.'); end;
  select * into r from reservations where id = rid;
  if r.id is null or r.status <> 'active' then return lab_fail('El apartado ya no está activo.'); end if;
  if r.reservation_date <> lab_today() then return lab_fail('Solo puedes sancionar el mismo día del apartado.'); end if;
  start_m := (8 + 2 * r.block) * 60;
  if nowm < start_m + 15 then return lab_fail('Todavía están dentro del margen de tolerancia.'); end if;
  if nowm > start_m + 30 then return lab_fail('La ventana para sancionar ya terminó.'); end if;

  until_d := lab_d(r.reservation_date + 1);
  update reservations set status = 'no_show', sanctioned_at = now() where id = r.id;
  update teams set sanctioned_until = until_d, sanction_reason = r.subject where id = r.team_id;
  return lab_ok(jsonb_build_object('until', until_d));
end $$;

create or replace function revert_sanction(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; r reservations; rid uuid;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'admin' then return lab_fail('Sesión no válida.'); end if;
  begin rid := (p->>'id')::uuid; exception when others then return lab_fail('Esa sanción ya no se puede revertir.'); end;
  select * into r from reservations where id = rid;
  if r.id is null or r.status <> 'no_show' or r.sanctioned_at is null then
    return lab_fail('Esa sanción ya no se puede revertir.');
  end if;
  if now() - r.sanctioned_at > interval '15 minutes' then
    return lab_fail('El tiempo para revertir la sanción ya pasó.');
  end if;
  update reservations set status = 'active', sanctioned_at = null where id = r.id;
  update teams set sanctioned_until = '', sanction_reason = '' where id = r.team_id;
  return lab_ok();
end $$;

-- ---------------------------------------------------------------------
--  Equipos (estudiante)
-- ---------------------------------------------------------------------

create or replace function get_student_teams(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; c app_config; today text := lab_d(lab_today());
        tms jsonb; sch jsonb; open_ boolean;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'student' then return lab_fail('Sesión no válida.'); end if;
  select * into st from students where id = s.user_id;
  if st.id is null then return lab_fail('Cuenta no encontrada.'); end if;
  select * into c from app_config where id = 1;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'subject', t.subject, 'team_number', t.team_number, 'has_number', t.has_number,
      'members', to_jsonb(t.members), 'owner_matricula', t.owner_matricula,
      'sanctioned_until', t.sanctioned_until,
      'sanctioned', t.sanctioned_until <> '' and today <= t.sanctioned_until) order by t.created_at desc), '[]'::jsonb)
    into tms from teams t where t.members @> array[st.matricula];

  select coalesce(jsonb_agg(jsonb_build_object(
      'team_id', t.id, 'subject', t.subject,
      'booked', coalesce((select jsonb_agg(jsonb_build_object(
                    'id', r.id, 'date', lab_d(r.reservation_date), 'block', r.block,
                    'practice', r.practice, 'plc', r.plc, 'mps', r.mps) order by r.reservation_date, r.block)
                  from reservations r where r.team_id = t.id and r.status = 'active'), '[]'::jsonb))
    order by t.created_at desc), '[]'::jsonb)
    into sch from teams t where t.members @> array[st.matricula];

  open_ := c.teams_enabled and (c.teams_start = '' or today >= c.teams_start) and (c.teams_end = '' or today <= c.teams_end);
  return lab_ok(jsonb_build_object('teams', tms, 'schedules', sch, 'windowOpen', open_,
    'config', jsonb_build_object('teams_enabled', c.teams_enabled, 'teams_start', c.teams_start, 'teams_end', c.teams_end)));
end $$;

create or replace function create_team(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s session_tokens; st students; c app_config; today text := lab_d(lab_today());
        subj text := p->>'subject'; num text := trim(coalesce(p->>'teamNumber', ''));
        has_n boolean := coalesce((p->>'hasNumber')::boolean, false);
        mats text[]; missing text[]; m text; created teams;
begin
  s := lab_session(p->>'token');
  if s.id is null or s.role <> 'student' then return lab_fail('Sesión no válida.'); end if;
  select * into st from students where id = s.user_id;
  if st.id is null then return lab_fail('Cuenta no encontrada.'); end if;
  select * into c from app_config where id = 1;

  if not (c.teams_enabled and (c.teams_start = '' or today >= c.teams_start) and (c.teams_end = '' or today <= c.teams_end)) then
    return lab_fail('La creación de equipos está cerrada en este momento.');
  end if;
  if subj not in ('Automatización', 'CNC', 'APM') then return lab_fail('Selecciona una materia válida.'); end if;
  if has_n and num !~ '^\d{1,4}$' then return lab_fail('El número de equipo debe contener solo dígitos.'); end if;

  perform pg_advisory_xact_lock(hashtext('lab_teams'));

  select coalesce(array_agg(x order by o), '{}') into mats from (
    select x, min(o) o from (
      select st.matricula x, 0 o
      union all
      select trim(v), o from jsonb_array_elements_text(coalesce(p->'members', '[]'::jsonb)) with ordinality t(v, o)
       where trim(v) <> ''
    ) a group by x) b;

  if exists (select 1 from unnest(mats) x where x !~ '^\d{8}$') then
    return lab_fail('Cada integrante debe tener una matrícula de 8 dígitos.');
  end if;
  if array_length(mats, 1) > 10 then return lab_fail('Un equipo no puede tener más de 10 integrantes.'); end if;

  select array(select x from unnest(mats) x where not exists (select 1 from students z where z.matricula = x)) into missing;
  if coalesce(array_length(missing, 1), 0) > 0 then
    return lab_fail('No encontramos estas matrículas: ' || array_to_string(missing, ', '));
  end if;

  foreach m in array mats loop
    if exists (select 1 from teams t where t.subject = subj and t.members @> array[m]) then
      return lab_fail('La matrícula ' || m || ' ya pertenece a un equipo de ' || subj || '.');
    end if;
  end loop;
  if (select count(*) from teams t where t.members @> array[st.matricula]) >= 3 then
    return lab_fail('Solo puedes pertenecer a 3 equipos (uno por materia).');
  end if;

  insert into teams (subject, team_number, has_number, members, owner_matricula)
  values (subj, case when has_n then num else '' end, has_n, mats, st.matricula)
  returning * into created;

  return lab_ok(jsonb_build_object('team', jsonb_build_object(
    'id', created.id, 'subject', created.subject, 'team_number', created.team_number,
    'has_number', created.has_number, 'members', to_jsonb(created.members),
    'owner_matricula', created.owner_matricula, 'sanctioned_until', '', 'sanctioned', false)));
end $$;

-- ---------------------------------------------------------------------
--  Administración
-- ---------------------------------------------------------------------

create or replace function lab_is_admin(p_token text) returns boolean
language plpgsql stable security definer set search_path = public, extensions as $$
declare s session_tokens;
begin
  s := lab_session(p_token);
  return s.id is not null and s.role = 'admin';
end $$;

create or replace function admin_list_students(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare today text := lab_d(lab_today()); rows jsonb;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'matricula', s.matricula, 'first_name', s.first_name, 'last_name', s.last_name,
      'teams', coalesce((select jsonb_agg(jsonb_build_object(
                  'id', t.id, 'subject', t.subject, 'team_number', t.team_number, 'has_number', t.has_number,
                  'sanctioned', t.sanctioned_until <> '' and today <= t.sanctioned_until,
                  'sanctioned_until', t.sanctioned_until) order by t.created_at desc)
                from teams t where t.members @> array[s.matricula]), '[]'::jsonb),
      'sanctioned', exists (select 1 from teams t where t.members @> array[s.matricula]
                              and t.sanctioned_until <> '' and today <= t.sanctioned_until)
    ) order by s.matricula), '[]'::jsonb) into rows from students s;
  return lab_ok(jsonb_build_object('students', rows));
end $$;

create or replace function admin_update_student(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare st students; sid uuid; mat text := trim(coalesce(p->>'matricula', ''));
        fn text := trim(coalesce(p->>'firstName', '')); ln text := trim(coalesce(p->>'lastName', ''));
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  if mat !~ '^\d{8}$' then return lab_fail('La matrícula debe tener 8 dígitos.'); end if;
  if fn = '' or ln = '' then return lab_fail('Nombre y apellido son obligatorios.'); end if;
  begin sid := (p->>'id')::uuid; exception when others then return lab_fail('Estudiante no encontrado.'); end;
  select * into st from students where id = sid;
  if st.id is null then return lab_fail('Estudiante no encontrado.'); end if;
  if mat <> st.matricula then
    if exists (select 1 from students where matricula = mat and id <> st.id) then
      return lab_fail('Esa matrícula ya está registrada.');
    end if;
    update teams set members = array_replace(members, st.matricula, mat) where members @> array[st.matricula];
    update teams set owner_matricula = mat where owner_matricula = st.matricula;
  end if;
  update students set matricula = mat, first_name = fn, last_name = ln where id = st.id;
  return lab_ok();
end $$;

create or replace function admin_delete_student(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare st students; sid uuid;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  begin sid := (p->>'id')::uuid; exception when others then return lab_fail('Estudiante no encontrado.'); end;
  select * into st from students where id = sid;
  if st.id is null then return lab_fail('Estudiante no encontrado.'); end if;
  update teams set members = array_remove(members, st.matricula) where members @> array[st.matricula];
  delete from session_tokens where user_id = st.id;
  delete from students where id = st.id;
  return lab_ok();
end $$;

create or replace function admin_list_teams(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare today text := lab_d(lab_today()); rows jsonb;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'subject', t.subject, 'team_number', t.team_number, 'has_number', t.has_number,
      'members', to_jsonb(t.members),
      'member_names', coalesce((select jsonb_agg(coalesce(z.first_name || ' ' || z.last_name, m) order by o)
                                  from unnest(t.members) with ordinality as u(m, o)
                                  left join students z on z.matricula = u.m), '[]'::jsonb),
      'sanctioned_until', t.sanctioned_until,
      'sanctioned', t.sanctioned_until <> '' and today <= t.sanctioned_until) order by t.created_at desc), '[]'::jsonb)
    into rows from teams t;
  return lab_ok(jsonb_build_object('teams', rows));
end $$;

create or replace function admin_update_team(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare tm teams; tid uuid; mems text[]; missing text[]; m text; clash teams;
        has_n boolean := coalesce((p->>'hasNumber')::boolean, false); num text := trim(coalesce(p->>'teamNumber', ''));
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  begin tid := (p->>'id')::uuid; exception when others then return lab_fail('Equipo no encontrado.'); end;
  select * into tm from teams where id = tid;
  if tm.id is null then return lab_fail('Equipo no encontrado.'); end if;

  select coalesce(array_agg(x order by o), '{}') into mems from (
    select x, min(o) o from (
      select trim(v) x, o from jsonb_array_elements_text(coalesce(p->'members', '[]'::jsonb)) with ordinality t(v, o)
    ) a where x <> '' group by x) b;

  if coalesce(array_length(mems, 1), 0) = 0 then return lab_fail('El equipo necesita al menos un integrante.'); end if;
  if exists (select 1 from unnest(mems) x where x !~ '^\d{8}$') then
    return lab_fail('Cada integrante debe tener una matrícula de 8 dígitos.');
  end if;
  select array(select x from unnest(mems) x where not exists (select 1 from students z where z.matricula = x)) into missing;
  if coalesce(array_length(missing, 1), 0) > 0 then
    return lab_fail('No existen estas matrículas: ' || array_to_string(missing, ', '));
  end if;
  foreach m in array mems loop
    select * into clash from teams t where t.id <> tm.id and t.subject = tm.subject and t.members @> array[m] limit 1;
    if clash.id is not null then
      return lab_fail('La matrícula ' || m || ' ya está en otro equipo de ' || tm.subject || '.');
    end if;
  end loop;
  if has_n and num !~ '^\d{1,4}$' then return lab_fail('El número de equipo debe contener solo dígitos.'); end if;

  update teams set members = mems, team_number = case when has_n then num else '' end, has_number = has_n
   where id = tm.id;
  return lab_ok();
end $$;

create or replace function admin_delete_team(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare tid uuid;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  begin tid := (p->>'id')::uuid; exception when others then return lab_ok(); end;
  update reservations set status = 'cancelled' where team_id = tid and status = 'active';
  delete from teams where id = tid;
  return lab_ok();
end $$;

create or replace function admin_delete_all_teams(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  update reservations set status = 'cancelled' where status = 'active';
  select count(*) into n from teams;
  delete from teams where true;
  return lab_ok(jsonb_build_object('deleted', n));
end $$;

create or replace function admin_list_admins(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare rows jsonb;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  select coalesce(jsonb_agg(lab_public_admin(a) order by a.created_at desc), '[]'::jsonb) into rows from admins a;
  return lab_ok(jsonb_build_object('admins', rows));
end $$;

create or replace function admin_create_admin(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare un text := trim(coalesce(p->>'username', '')); em text := trim(coalesce(p->>'email', ''));
        pw text := coalesce(p->>'password', '');
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  if un = '' then return lab_fail('El usuario es obligatorio.'); end if;
  if not lab_valid_email(em) then return lab_fail('Escribe un correo válido.'); end if;
  if length(pw) < 6 then return lab_fail('La contraseña debe tener al menos 6 caracteres.'); end if;
  if exists (select 1 from admins where lower(username) = lower(un)) then return lab_fail('Ese usuario ya existe.'); end if;
  insert into admins (username, first_name, last_name, email, password_hash)
  values (un, trim(coalesce(p->>'firstName', '')), trim(coalesce(p->>'lastName', '')), lower(em), crypt(pw, gen_salt('bf')));
  return lab_ok();
end $$;

create or replace function admin_get_settings(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare c app_config;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  select * into c from app_config where id = 1;
  return lab_ok(jsonb_build_object('config', jsonb_build_object(
    'id', c.id, 'registration_enabled', c.registration_enabled, 'registration_start', c.registration_start,
    'registration_end', c.registration_end, 'teams_enabled', c.teams_enabled, 'teams_start', c.teams_start,
    'teams_end', c.teams_end, 'ip_restriction_enabled', c.ip_restriction_enabled, 'allowed_ips', c.allowed_ips)));
end $$;

create or replace function admin_update_settings(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare ips text[]; bad text[];
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  ips := array(select x from regexp_split_to_table(coalesce(p->>'allowed_ips', ''), '[,\s]+') x where x <> '');
  bad := array(select x from unnest(ips) x where x !~ '^\d{1,3}(\.\d{1,3}){3}$');
  if coalesce(array_length(bad, 1), 0) > 0 then
    return lab_fail('Estas IP no son válidas: ' || array_to_string(bad, ', '));
  end if;
  update app_config set
    registration_enabled = coalesce((p->>'registration_enabled')::boolean, false),
    registration_start = coalesce(p->>'registration_start', ''),
    registration_end = coalesce(p->>'registration_end', ''),
    teams_enabled = coalesce((p->>'teams_enabled')::boolean, false),
    teams_start = coalesce(p->>'teams_start', ''),
    teams_end = coalesce(p->>'teams_end', ''),
    ip_restriction_enabled = coalesce((p->>'ip_restriction_enabled')::boolean, true),
    allowed_ips = array_to_string(ips, ', ')
  where id = 1;
  return lab_ok();
end $$;

create or replace function admin_reservations_report(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare items jsonb; f date; t date;
begin
  if not lab_is_admin(p->>'token') then return lab_fail('Sesión no válida.'); end if;
  begin
    if coalesce(p->>'from', '') <> '' and coalesce(p->>'to', '') <> '' then
      f := (p->>'from')::date; t := (p->>'to')::date;
    end if;
  exception when others then
    return lab_fail('Rango de fechas no válido.');
  end;
  select coalesce(jsonb_agg(jsonb_build_object(
      'date', lab_d(r.reservation_date), 'block_index', r.block, 'block', lab_block_label(r.block),
      'subject', r.subject, 'practice', r.practice, 'plc', r.plc, 'mps', r.mps,
      'team', case when tm.has_number and tm.team_number <> '' then 'Equipo ' || tm.team_number else 'Equipo sin número' end,
      'members', coalesce(array_to_string(tm.members, ', '), ''),
      'booker', r.booker_name, 'matricula', r.booker_matricula,
      'status', case r.status when 'active' then 'Activa' when 'cancelled' then 'Cancelada'
                              when 'no_show' then 'No asistió' when 'attended' then 'Asistió' else r.status end)
    order by r.reservation_date, r.block, r.created_at), '[]'::jsonb)
    into items
    from reservations r left join teams tm on tm.id = r.team_id
   where (not coalesce((p->>'activeOnly')::boolean, false) or r.status = 'active')
     and (f is null or (r.reservation_date >= f and r.reservation_date <= t));
  return jsonb_build_object('ok', true, 'items', items);
end $$;

-- ---------------------------------------------------------------------
--  Permisos: solo las funciones "públicas" de la app son invocables
--  desde el navegador; las utilidades lab_* quedan privadas.
-- ---------------------------------------------------------------------

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname as name
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and p.proname in ('lab_today','lab_minutes','lab_ok','lab_fail','lab_d','lab_valid_email','lab_practices',
                         'lab_capacity','lab_block_label','lab_session','lab_new_token','lab_request_ip','lab_bookable',
                         'lab_public_student','lab_public_admin','lab_create_reset_token','lab_is_admin',
                         'public_config','register_student','login_student','login_admin','session_info','logout',
                         'update_student_profile','update_admin_profile','reset_password','get_schedule','acquire_slot',
                         'release_slot','create_reservation','cancel_reservation','admin_delete_reservation',
                         'sanction_reservation','revert_sanction','get_student_teams','create_team','admin_list_students',
                         'admin_update_student','admin_delete_student','admin_list_teams','admin_update_team',
                         'admin_delete_team','admin_delete_all_teams','admin_list_admins','admin_create_admin',
                         'admin_get_settings','admin_update_settings','admin_reservations_report')
  loop
    execute format('revoke all on function %s from public', f.sig);
    begin
      execute format('revoke all on function %s from anon, authenticated', f.sig);
    exception when undefined_object then null;
    end;
    if f.name not like 'lab\_%' then
      begin
        execute format('grant execute on function %s to anon, authenticated', f.sig);
      exception when undefined_object then null;
      end;
    end if;
  end loop;
end $$;

-- La función que crea tokens de recuperación solo la usa la Edge Function.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function lab_create_reset_token(text) to service_role;
  end if;
end $$;
