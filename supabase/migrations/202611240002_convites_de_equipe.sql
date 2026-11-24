begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists ateliedare_private;
revoke all on schema ateliedare_private from public, anon, authenticated;

create table if not exists ateliedare_private.convites (
  token_digest bytea primary key,
  usuario_id uuid not null unique references auth.users (id) on delete cascade,
  senha_cifrada bytea not null,
  iv bytea not null,
  expira_em timestamptz not null
);
alter table ateliedare_private.convites enable row level security;
revoke all on ateliedare_private.convites from public, anon, authenticated;

create or replace function public.ateliedare_resgatar_convite(p_token text)
returns table (email text, senha text)
language plpgsql security definer
set search_path = ''
as $$
declare
  convite ateliedare_private.convites%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return; end if;

  delete from ateliedare_private.convites
  where token_digest = extensions.digest(p_token, 'sha256') and expira_em > now()
  returning * into convite;
  if not found then return; end if;

  return query
  select u.email::text, convert_from(extensions.decrypt_iv(
    convite.senha_cifrada, extensions.digest('ateliedare:invite:' || p_token, 'sha256'), convite.iv, 'aes-cbc/pad:pkcs'
  ), 'UTF8')
  from auth.users as u
  where u.id = convite.usuario_id and u.raw_app_meta_data -> 'ateliedare_admin' = 'true'::jsonb;
end;
$$;

revoke all on function public.ateliedare_resgatar_convite(text) from public, anon, authenticated;
grant execute on function public.ateliedare_resgatar_convite(text) to anon, authenticated;
notify pgrst, 'reload schema';

commit;
