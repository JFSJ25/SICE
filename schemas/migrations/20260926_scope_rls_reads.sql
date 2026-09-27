-- SICE: limita las lecturas al contexto academico del usuario.
-- Ejecutar despues de 20260926_harden_rls.sql.

begin;

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

-- Usuarios: propio perfil o usuarios del mismo paralelo visible.
drop policy if exists "usuarios_select" on public.usuarios;
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

-- Paralelos
drop policy if exists "paralelos_select" on public.paralelos;
create policy "paralelos_select" on public.paralelos
  for select using (public.puede_ver_paralelo(id));

-- Matriculas: estudiante propio, profesor del paralelo o administrador.
drop policy if exists "matriculas_select" on public.matriculas;
create policy "matriculas_select" on public.matriculas
  for select using (
    usuario_id = auth.uid()
    or public.puede_ver_paralelo(paralelo_id)
  );

-- Hemisemestres
drop policy if exists "hemisemestres_select" on public.hemisemestres;
create policy "hemisemestres_select" on public.hemisemestres
  for select using (public.puede_ver_paralelo(paralelo_id));

-- Grupos
drop policy if exists "grupos_select" on public.grupos;
create policy "grupos_select" on public.grupos
  for select using (public.puede_ver_paralelo(paralelo_id));

-- Miembros: necesarios para mostrar integrantes durante la coevaluacion.
drop policy if exists "grupo_miembros_select" on public.grupo_miembros;
create policy "grupo_miembros_select" on public.grupo_miembros
  for select using (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_miembros.grupo_id
        and public.puede_ver_paralelo(g.paralelo_id)
    )
  );

-- Temas
drop policy if exists "grupo_temas_select" on public.grupo_temas;
create policy "grupo_temas_select" on public.grupo_temas
  for select using (
    exists (
      select 1
      from public.grupos g
      where g.id = grupo_temas.grupo_id
        and public.puede_ver_paralelo(g.paralelo_id)
    )
  );

-- Configuracion de notas
drop policy if exists "config_notas_select" on public.configuracion_notas;
create policy "config_notas_select" on public.configuracion_notas
  for select using (public.puede_ver_paralelo(paralelo_id));

-- Calificaciones docentes: estudiante propio, profesor del paralelo o admin.
drop policy if exists "calif_docente_select" on public.calificaciones_docente;
create policy "calif_docente_select" on public.calificaciones_docente
  for select using (
    estudiante_id = auth.uid()
    or public.es_admin()
    or exists (
      select 1
      from public.grupos g
      where g.id = calificaciones_docente.grupo_id
        and public.puede_ver_paralelo(g.paralelo_id)
        and public.es_admin() = false
        and exists (
          select 1
          from public.paralelos p
          where p.id = g.paralelo_id
            and p.profesor_id = auth.uid()
        )
    )
  );

-- Coevaluaciones: evaluador propio, profesor del paralelo o admin.
drop policy if exists "coeval_select" on public.coevaluaciones;
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

commit;
