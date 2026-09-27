-- SICE: endurecimiento de RLS para una base ya existente.
-- Ejecutar en Supabase SQL Editor con una cuenta administrativa.
-- No vuelve a crear tablas ni modifica los registros existentes.

begin;

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

-- Paralelos
 drop policy if exists "paralelos_write" on public.paralelos;
create policy "paralelos_write" on public.paralelos
  for all using (public.es_admin() or profesor_id = auth.uid())
  with check (public.es_admin() or profesor_id = auth.uid());

-- Matriculas
 drop policy if exists "matriculas_write" on public.matriculas;
create policy "matriculas_write" on public.matriculas
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- Hemisemestres
 drop policy if exists "hemisemestres_write" on public.hemisemestres;
create policy "hemisemestres_write" on public.hemisemestres
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- Grupos
 drop policy if exists "grupos_write" on public.grupos;
create policy "grupos_write" on public.grupos
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- Miembros de grupos
 drop policy if exists "grupo_miembros_write" on public.grupo_miembros;
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

-- Temas de grupos
 drop policy if exists "grupo_temas_write" on public.grupo_temas;
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

-- Configuracion de notas
 drop policy if exists "config_notas_write" on public.configuracion_notas;
create policy "config_notas_write" on public.configuracion_notas
  for all using (public.puede_gestionar_paralelo(paralelo_id))
  with check (public.puede_gestionar_paralelo(paralelo_id));

-- Calificaciones docentes
 drop policy if exists "calif_docente_write" on public.calificaciones_docente;
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

commit;
