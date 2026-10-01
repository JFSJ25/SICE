-- ============================================================
-- ESQUEMA SUPABASE — SICE v3
-- Cambios respecto a v2:
--   • grupo_miembros.coordinador → lider
--   • Trigger: al crear un paralelo se crean automáticamente sus
--     2 hemisemestres y su fila en configuracion_notas (70/30 confirmado)
--   • configuracion_notas.peso_profesor/peso_coevaluacion ya no son
--     provisionales — son el valor definitivo confirmado por el profesor
-- ============================================================

-- ------------------------------------------------------------
-- 1. ESTRUCTURA ACADÉMICA
-- ------------------------------------------------------------

create table public.usuarios (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  email           text unique,
  rol_sistema     text not null check (rol_sistema in ('admin', 'profesor', 'estudiante')),
  creado_en       timestamptz not null default now()
);

create table public.materias (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null unique,
  semestre  text not null,
  creado_en timestamptz not null default now()
);

create table public.periodos (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null unique,
  creado_en timestamptz not null default now()
);

create table public.paralelos (
  id          uuid primary key default gen_random_uuid(),
  materia_id  uuid not null references public.materias(id)  on delete restrict,
  periodo_id  uuid not null references public.periodos(id)  on delete cascade,
  codigo      text not null check (codigo in ('A', 'B', 'C')),
  profesor_id uuid references public.usuarios(id),
  creado_en   timestamptz not null default now(),
  unique (materia_id, periodo_id, codigo)
);

create table public.matriculas (
  id          uuid primary key default gen_random_uuid(),
  paralelo_id uuid not null references public.paralelos(id) on delete cascade,
  usuario_id  uuid not null references public.usuarios(id)  on delete cascade,
  unique (paralelo_id, usuario_id)
);

-- Un estudiante solo puede tener una materia-paralelo por periodo académico.
create or replace function public.validar_matricula_un_periodo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_periodo_id uuid;
begin
  select p.periodo_id
    into nuevo_periodo_id
    from public.paralelos p
   where p.id = new.paralelo_id;

  if nuevo_periodo_id is null then
    raise exception 'El paralelo no tiene un periodo académico válido';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.usuario_id::text || ':' || nuevo_periodo_id::text, 0)
  );

  if exists (
    select 1
      from public.matriculas m
      join public.paralelos p on p.id = m.paralelo_id
     where m.usuario_id = new.usuario_id
       and p.periodo_id = nuevo_periodo_id
       and m.id is distinct from new.id
  ) then
    raise exception using
      errcode = '23505',
      message = 'El estudiante ya está matriculado en otra materia-paralelo de este periodo académico';
  end if;

  return new;
end;
$$;

create trigger trg_matricula_un_periodo
before insert or update of paralelo_id, usuario_id on public.matriculas
for each row execute function public.validar_matricula_un_periodo();

-- Siempre exactamente 2 por paralelo; se crean automáticamente via trigger.
-- El profesor nunca los crea ni edita manualmente.
create table public.hemisemestres (
  id          uuid primary key default gen_random_uuid(),
  paralelo_id uuid not null references public.paralelos(id) on delete cascade,
  nombre      text not null,
  orden       int  not null check (orden in (1, 2)),
  unique (paralelo_id, orden)
);

-- ------------------------------------------------------------
-- 2. GRUPOS
-- ------------------------------------------------------------

create table public.grupos (
  id              uuid primary key default gen_random_uuid(),
  paralelo_id     uuid not null references public.paralelos(id) on delete cascade,
  numero          int  not null,
  max_integrantes int  not null default 5,
  unique (paralelo_id, numero)
);

-- Tema del grupo. Un tema por hemisemestre (pueden ser distintos).
-- Si el profesor no cambia el tema en el 2do hemisemestre, la UI
-- propone copiar el del 1ro automáticamente.
create table public.grupo_temas (
  id              uuid primary key default gen_random_uuid(),
  grupo_id        uuid not null references public.grupos(id)        on delete cascade,
  hemisemestre_id uuid not null references public.hemisemestres(id) on delete cascade,
  tema            text not null,
  unique (grupo_id, hemisemestre_id)
);

create table public.grupo_miembros (
  id         uuid primary key default gen_random_uuid(),
  grupo_id   uuid not null references public.grupos(id)   on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  rol_grupo  text not null check (rol_grupo in ('expositor', 'evaluador')),
  -- "lider" reemplaza a "coordinador"; hay uno por grupo
  lider      boolean not null default false,
  unique (grupo_id, usuario_id)
);

-- Cada grupo puede tener como máximo un líder.
create unique index grupo_miembros_un_lider_por_grupo
  on public.grupo_miembros (grupo_id)
  where lider = true;

-- ------------------------------------------------------------
-- 3. RÚBRICAS
-- ------------------------------------------------------------

create table public.rubricas (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in (
                  'CALIF_EXPOSITOR', 'CALIF_EVALUADOR',
                  'COEVAL_EXPOSITOR', 'COEVAL_EVALUADOR'
                )),
  nombre        text not null,
  nota_especial text,
  version       int  not null default 1,
  activa        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create table public.rubrica_categorias (
  id         uuid primary key default gen_random_uuid(),
  rubrica_id uuid not null references public.rubricas(id) on delete cascade,
  nombre     text not null,
  orden      int  not null
);

create table public.rubrica_criterios (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.rubrica_categorias(id) on delete cascade,
  nombre       text not null,
  observacion  text,
  orden        int  not null
);

create table public.rubrica_opciones (
  id          uuid primary key default gen_random_uuid(),
  criterio_id uuid    not null references public.rubrica_criterios(id) on delete cascade,
  etiqueta    text    not null,
  puntos      numeric not null,
  orden       int     not null
);

-- ------------------------------------------------------------
-- 4. CALIFICACIONES
-- ------------------------------------------------------------

create table public.calificaciones_docente (
  id              uuid primary key default gen_random_uuid(),
  profesor_id     uuid    not null references public.usuarios(id),
  estudiante_id   uuid    not null references public.usuarios(id),
  grupo_id        uuid    not null references public.grupos(id),
  hemisemestre_id uuid    not null references public.hemisemestres(id),
  rubrica_id      uuid    not null references public.rubricas(id),
  respuestas      jsonb   not null,
  puntaje         numeric not null,
  comentario      text,
  actualizado_en  timestamptz not null default now(),
  unique (estudiante_id, hemisemestre_id, rubrica_id)
);

create table public.coevaluaciones (
  id                uuid primary key default gen_random_uuid(),
  evaluador_id      uuid    not null references public.usuarios(id),
  grupo_evaluado_id uuid    not null references public.grupos(id),
  hemisemestre_id   uuid    not null references public.hemisemestres(id),
  rubrica_id        uuid    not null references public.rubricas(id),
  respuestas        jsonb   not null,
  puntaje           numeric not null,
  actualizado_en    timestamptz not null default now(),
  unique (evaluador_id, grupo_evaluado_id, hemisemestre_id, rubrica_id)
);

-- Trigger: impide auto-coevaluación (segunda línea de defensa tras la UI)
create or replace function public.chk_no_autocoevaluacion()
returns trigger as $$
begin
  if exists (
    select 1 from public.grupo_miembros gm
    where gm.usuario_id = new.evaluador_id
      and gm.grupo_id   = new.grupo_evaluado_id
  ) then
    raise exception 'Un estudiante no puede coevaluar a su propio grupo';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_no_autocoevaluacion
before insert or update on public.coevaluaciones
for each row execute function public.chk_no_autocoevaluacion();

-- Ponderación confirmada: 70% profesor / 30% coevaluación.
-- Se crea automáticamente al crear el paralelo (ver trigger abajo).
create table public.configuracion_notas (
  paralelo_id       uuid    primary key references public.paralelos(id) on delete cascade,
  peso_profesor     numeric not null default 0.7,
  peso_coevaluacion numeric not null default 0.3
);

-- ============================================================
-- 5. TRIGGERS DE INICIALIZACIÓN
-- ============================================================

-- Al insertar un paralelo:
--   a) Crea los 2 hemisemestres con nombres fijos.
--   b) Registra la ponderación 70/30 en configuracion_notas.
-- El profesor nunca tiene que hacer esto manualmente.
create or replace function public.inicializar_paralelo()
returns trigger as $$
begin
  -- Hemisemestres
  insert into public.hemisemestres (paralelo_id, nombre, orden) values
    (new.id, 'Primer hemisemestre',  1),
    (new.id, 'Segundo hemisemestre', 2);

  -- Ponderación de notas
  insert into public.configuracion_notas (paralelo_id, peso_profesor, peso_coevaluacion)
  values (new.id, 0.7, 0.3);

  return new;
end;
$$ language plpgsql;

create trigger trg_inicializar_paralelo
after insert on public.paralelos
for each row execute function public.inicializar_paralelo();

-- ============================================================
-- 6. FUNCIÓN SECURITY DEFINER — promedios anonimizados
-- ============================================================

create or replace function public.obtener_coeval_promedio(
  p_grupo_id        uuid,
  p_hemisemestre_id uuid,
  p_rubrica_id      uuid
) returns table(promedio numeric, cantidad bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.es_staff() or exists (
      select 1 from public.grupos g
      join public.matriculas m on m.paralelo_id = g.paralelo_id
      where g.id = p_grupo_id
        and m.usuario_id = auth.uid()
    )
  ) then
    raise exception 'No autorizado';
  end if;

  return query
    select avg(c.puntaje), count(*)
    from public.coevaluaciones c
    where c.grupo_evaluado_id = p_grupo_id
      and c.hemisemestre_id   = p_hemisemestre_id
      and c.rubrica_id        = p_rubrica_id;
end;
$$;

revoke all    on function public.obtener_coeval_promedio(uuid, uuid, uuid) from public;
grant execute on function public.obtener_coeval_promedio(uuid, uuid, uuid) to authenticated;

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

alter table public.usuarios              enable row level security;
alter table public.materias              enable row level security;
alter table public.periodos              enable row level security;
alter table public.paralelos             enable row level security;
alter table public.matriculas            enable row level security;
alter table public.hemisemestres         enable row level security;
alter table public.grupos                enable row level security;
alter table public.grupo_temas           enable row level security;
alter table public.grupo_miembros        enable row level security;
alter table public.rubricas              enable row level security;
alter table public.rubrica_categorias    enable row level security;
alter table public.rubrica_criterios     enable row level security;
alter table public.rubrica_opciones      enable row level security;
alter table public.calificaciones_docente enable row level security;
alter table public.coevaluaciones        enable row level security;
alter table public.configuracion_notas   enable row level security;

-- Privilegios base de PostgreSQL. RLS continúa controlando qué filas puede
-- leer o modificar cada usuario autenticado.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete
on all tables in schema public
to authenticated, service_role;

-- Helper centralizado
create or replace function public.es_staff()
returns boolean as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid()
      and rol_sistema in ('profesor', 'admin')
  );
$$ language sql stable security definer;

create or replace function public.es_admin()
returns boolean as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid()
      and rol_sistema = 'admin'
  );
$$ language sql stable security definer set search_path = public;

create or replace function public.puede_gestionar_paralelo(p_paralelo_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.paralelos p
    join public.usuarios u on u.id = auth.uid()
    where p.id = p_paralelo_id
      and (u.rol_sistema = 'admin' or p.profesor_id = auth.uid())
  );
$$ language sql stable security definer set search_path = public;

create or replace function public.puede_ver_paralelo(p_paralelo_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.paralelos p
    where p.id = p_paralelo_id
      and (
        public.es_admin()
        or p.profesor_id = auth.uid()
        or exists (
          select 1
          from public.matriculas m
          where m.paralelo_id = p.id
            and m.usuario_id = auth.uid()
        )
      )
  );
$$ language sql stable security definer set search_path = public;

-- usuarios
create policy "usuarios_select" on public.usuarios
  for select using (
    id = auth.uid()
    or public.es_admin()
    or exists (
      select 1
      from public.matriculas m
      where m.usuario_id = public.usuarios.id
        and public.puede_ver_paralelo(m.paralelo_id)
    )
  );

-- materias, periodos, paralelos — lectura libre para autenticados
create policy "materias_select"  on public.materias  for select using (auth.role() = 'authenticated');
create policy "materias_write"   on public.materias  for all    using (public.es_staff()) with check (public.es_staff());
create policy "periodos_select"  on public.periodos  for select using (auth.role() = 'authenticated');
create policy "periodos_write"   on public.periodos  for all    using (public.es_staff()) with check (public.es_staff());
create policy "paralelos_select" on public.paralelos
  for select using (public.puede_ver_paralelo(id));
create policy "paralelos_write"  on public.paralelos
  for all using (public.es_admin() or profesor_id = auth.uid())
  with check (public.es_admin() or profesor_id = auth.uid());

-- matriculas
create policy "matriculas_select" on public.matriculas
  for select using (
    usuario_id = auth.uid()
    or public.puede_ver_paralelo(paralelo_id)
  );
create policy "matriculas_write" on public.matriculas
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- hemisemestres — visibles para autenticados
create policy "hemisemestres_select" on public.hemisemestres
  for select using (public.puede_ver_paralelo(paralelo_id));
create policy "hemisemestres_write" on public.hemisemestres
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- grupos — lectura para autenticados para coevaluar
create policy "grupos_select" on public.grupos
  for select using (public.puede_ver_paralelo(paralelo_id));
create policy "grupos_write" on public.grupos
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- grupo_miembros
create policy "grupo_miembros_select" on public.grupo_miembros
  for select using (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_miembros.grupo_id
        and public.puede_ver_paralelo(g.paralelo_id)
    )
  );
create policy "grupo_miembros_write" on public.grupo_miembros
  for all using (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_miembros.grupo_id
        and public.puede_gestionar_paralelo(g.paralelo_id)
    )
  )
  with check (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_miembros.grupo_id
        and public.puede_gestionar_paralelo(g.paralelo_id)
    )
  );

-- grupo_temas
create policy "grupo_temas_select" on public.grupo_temas
  for select using (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_temas.grupo_id
        and public.puede_ver_paralelo(g.paralelo_id)
    )
  );
create policy "grupo_temas_write" on public.grupo_temas
  for all using (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_temas.grupo_id
        and public.puede_gestionar_paralelo(g.paralelo_id)
    )
  )
  with check (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_temas.grupo_id
        and public.puede_gestionar_paralelo(g.paralelo_id)
    )
  );

-- configuracion_notas
-- create policy "config_notas_select" on public.configuracion_notas
--   for select using (auth.role() = 'authenticated');
-- create policy "config_notas_write" on public.configuracion_notas
--   for all using (public.puede_gestionar_paralelo(paralelo_id))
--   with check (public.puede_gestionar_paralelo(paralelo_id));

-- rubricas y estructura
create policy "rubricas_select"           on public.rubricas           for select using (auth.role() = 'authenticated');
create policy "rubricas_write"            on public.rubricas           for all    using (public.es_staff()) with check (public.es_staff());
create policy "rubrica_categorias_select" on public.rubrica_categorias for select using (auth.role() = 'authenticated');
create policy "rubrica_categorias_write"  on public.rubrica_categorias for all    using (public.es_staff()) with check (public.es_staff());
create policy "rubrica_criterios_select"  on public.rubrica_criterios  for select using (auth.role() = 'authenticated');
create policy "rubrica_criterios_write"   on public.rubrica_criterios  for all    using (public.es_staff()) with check (public.es_staff());
create policy "rubrica_opciones_select"   on public.rubrica_opciones   for select using (auth.role() = 'authenticated');
create policy "rubrica_opciones_write"    on public.rubrica_opciones   for all    using (public.es_staff()) with check (public.es_staff());

-- calificaciones_docente
create policy "calif_docente_select" on public.calificaciones_docente
  for select using (
    estudiante_id = auth.uid()
    or public.es_admin()
    or exists (
      select 1
      from public.grupos g
      join public.paralelos p on p.id = g.paralelo_id
      where g.id = calificaciones_docente.grupo_id
        and p.profesor_id = auth.uid()
    )
  );
create policy "calif_docente_write" on public.calificaciones_docente
  for all using (
    public.es_admin() or (
      profesor_id = auth.uid()
      and exists (
        select 1
        from public.grupos g
        where g.id = calificaciones_docente.grupo_id
          and public.puede_gestionar_paralelo(g.paralelo_id)
      )
    )
  )
  with check (
    public.es_admin() or (
      profesor_id = auth.uid()
      and exists (
        select 1
        from public.grupos g
        where g.id = calificaciones_docente.grupo_id
          and public.puede_gestionar_paralelo(g.paralelo_id)
      )
    )
  );

-- coevaluaciones — insert/update solo del propio evaluador; select propio o staff
create policy "coeval_insert" on public.coevaluaciones
  for insert with check (evaluador_id = auth.uid());
create policy "coeval_update" on public.coevaluaciones
  for update using (evaluador_id = auth.uid()) with check (evaluador_id = auth.uid());
create policy "coeval_select" on public.coevaluaciones
  for select using (
    evaluador_id = auth.uid()
    or public.es_admin()
    or exists (
      select 1
      from public.grupos g
      join public.paralelos p on p.id = g.paralelo_id
      where g.id = coevaluaciones.grupo_evaluado_id
        and p.profesor_id = auth.uid()
    )
  );

-- configuracion_notas
create policy "config_notas_select" on public.configuracion_notas
  for select using (public.puede_ver_paralelo(paralelo_id));
create policy "config_notas_write" on public.configuracion_notas
  for all using (public.es_staff()) with check (public.es_staff());
