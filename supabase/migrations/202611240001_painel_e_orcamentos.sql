-- Aplicar ao banco existente do Ateliê da Rê.
begin;

create or replace function public.ateliedare_admin()
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' -> 'ateliedare_admin' = 'true'::jsonb, false);
$$;

revoke all on function public.ateliedare_admin() from public;
grant execute on function public.ateliedare_admin() to anon, authenticated;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'produtos', 'materiais', 'produto_materiais', 'configuracoes',
    'custos_fixos', 'etiquetas', 'clientes', 'orcamentos', 'orcamento_itens'
  ] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('revoke all on public.%I from public, anon', tabela);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tabela);
    execute format(
      'create policy ateliedare_acesso on public.%I as restrictive for all to anon, authenticated
       using ((select public.ateliedare_admin())) with check ((select public.ateliedare_admin()))', tabela
    );
    execute format(
      'create policy ateliedare_equipe on public.%I for all to authenticated
       using ((select public.ateliedare_admin())) with check ((select public.ateliedare_admin()))', tabela
    );
  end loop;
end $$;

-- O bucket existente serve imagens públicas. Escrita e listagem pela API exigem acesso ao painel.
create policy ateliedare_arquivos_restritos on storage.objects as restrictive
for all to anon, authenticated
using (bucket_id <> 'precificacao' or (select public.ateliedare_admin()))
with check (bucket_id <> 'precificacao' or (select public.ateliedare_admin()));

create policy ateliedare_arquivos_equipe on storage.objects
for all to authenticated
using (bucket_id = 'precificacao' and (select public.ateliedare_admin()))
with check (bucket_id = 'precificacao' and (select public.ateliedare_admin()));

alter table public.produtos add column if not exists etiquetas_ids jsonb not null default '[]';
alter table public.produtos add column if not exists operacao_criacao uuid unique;
alter table public.orcamentos add column if not exists operacao_criacao uuid unique;
alter table public.orcamentos add column if not exists link_publico uuid;
alter table public.orcamentos add column if not exists link_expira_em timestamptz;
create unique index if not exists ateliedare_orcamento_link_idx on public.orcamentos (link_publico);
create index if not exists ateliedare_orcamento_itens_orcamento_idx on public.orcamento_itens (orcamento_id);
create index if not exists ateliedare_produto_materiais_produto_idx on public.produto_materiais (produto_id);

create or replace function public.ateliedare_compartilhar_orcamento(p_id text)
returns uuid
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_id public.orcamentos.id%type := p_id;
  v_token uuid;
begin
  if not public.ateliedare_admin() then raise exception 'Acesso restrito' using errcode = '42501'; end if;

  update public.orcamentos
  set link_publico = case when link_expira_em > now() then coalesce(link_publico, gen_random_uuid()) else gen_random_uuid() end,
      link_expira_em = case when link_publico is not null and link_expira_em > now() then link_expira_em else now() + interval '7 days' end
  where id = v_id
  returning link_publico into strict v_token;
  return v_token;
end;
$$;

create or replace function public.ateliedare_orcamento_publico(p_token uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'cliente', coalesce(c.nome, o.nome_cliente_manual),
    'created_at', o.created_at,
    'data_entrega', o.data_entrega,
    'link_expira_em', o.link_expira_em,
    'total', o.total,
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', i.nome, 'quantidade', i.quantidade, 'preco_unitario', i.preco_unitario,
        'total', i.total, 'notas', i.notas
      ) order by i.id) from public.orcamento_itens as i where i.orcamento_id = o.id
    ), '[]'::jsonb)
  )
  from public.orcamentos as o
  left join public.clientes as c on c.id = o.cliente_id
  where o.link_publico = p_token and o.link_expira_em > now();
$$;

create or replace function public.ateliedare_salvar_produto(p_id text, p_produto jsonb, p_materiais jsonb, p_operacao uuid)
returns text
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_id public.produtos.id%type := p_id;
  produto public.produtos := jsonb_populate_record(null::public.produtos, p_produto);
begin
  if not public.ateliedare_admin() then raise exception 'Acesso restrito' using errcode = '42501'; end if;

  if v_id is null then
    insert into public.produtos (
      nome, descricao, notas, imagem_url, favorito, preco_final, preco_sugerido,
      margem_lucro, tempo_trabalho, custo_materiais, custo_trabalho, rendimento, etiquetas_ids, operacao_criacao
    ) values (
      produto.nome, produto.descricao, produto.notas, produto.imagem_url, produto.favorito,
      produto.preco_final, produto.preco_sugerido, produto.margem_lucro, produto.tempo_trabalho,
      produto.custo_materiais, produto.custo_trabalho, produto.rendimento, produto.etiquetas_ids, p_operacao
    ) on conflict (operacao_criacao) do nothing returning id into v_id;
    if v_id is null then
      select id into strict v_id from public.produtos where operacao_criacao = p_operacao;
      return v_id::text;
    end if;
  else
    update public.produtos set
      nome = produto.nome, descricao = produto.descricao, notas = produto.notas, imagem_url = produto.imagem_url,
      favorito = produto.favorito, preco_final = produto.preco_final, preco_sugerido = produto.preco_sugerido,
      margem_lucro = produto.margem_lucro, tempo_trabalho = produto.tempo_trabalho, custo_materiais = produto.custo_materiais,
      custo_trabalho = produto.custo_trabalho, rendimento = produto.rendimento, etiquetas_ids = produto.etiquetas_ids
    where id = v_id returning id into strict v_id;
    delete from public.produto_materiais where produto_id = v_id;
  end if;

  insert into public.produto_materiais (produto_id, material_id, nome, quantidade, unidade, custo)
  select v_id, material_id, nome, quantidade, unidade, custo
  from jsonb_populate_recordset(null::public.produto_materiais, p_materiais);

  return v_id::text;
end;
$$;

create or replace function public.ateliedare_excluir_produto(p_id text)
returns void
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_id public.produtos.id%type := p_id;
begin
  if not public.ateliedare_admin() then raise exception 'Acesso restrito' using errcode = '42501'; end if;

  perform 1 from public.produtos where id = v_id for update;
  if exists (select 1 from public.orcamento_itens where produto_id = v_id) then
    raise exception 'Este produto está vinculado a um orçamento' using errcode = '23503';
  end if;

  delete from public.produto_materiais where produto_id = v_id;
  delete from public.produtos where id = v_id;
end;
$$;

create or replace function public.ateliedare_salvar_orcamento(p_id text, p_orcamento jsonb, p_itens jsonb, p_operacao uuid)
returns text
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_id public.orcamentos.id%type := p_id;
  orcamento public.orcamentos := jsonb_populate_record(null::public.orcamentos, p_orcamento);
  v_nome text := nullif(trim(p_orcamento ->> 'nome_cliente_manual'), '');
begin
  if not public.ateliedare_admin() then raise exception 'Acesso restrito' using errcode = '42501'; end if;

  if v_id is null and p_operacao is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_operacao::text, 1));
    select id into v_id from public.orcamentos where operacao_criacao = p_operacao;
    if v_id is not null then return v_id::text; end if;
  end if;

  if orcamento.cliente_id is null and v_nome is not null then
    perform pg_advisory_xact_lock(hashtextextended(lower(v_nome), 0));
    select id into orcamento.cliente_id from public.clientes
    where lower(nome) = lower(v_nome) order by id limit 1;
    if orcamento.cliente_id is null then
      insert into public.clientes (nome) values (v_nome) returning id into orcamento.cliente_id;
    end if;
  end if;

  if v_id is null then
    insert into public.orcamentos (cliente_id, nome_cliente_manual, total, data_entrega, status, operacao_criacao)
    values (orcamento.cliente_id, null, orcamento.total, orcamento.data_entrega, 'Pendente', p_operacao)
    returning id into v_id;
  else
    update public.orcamentos
    set cliente_id = orcamento.cliente_id, nome_cliente_manual = null,
        total = orcamento.total, data_entrega = orcamento.data_entrega
    where id = v_id returning id into strict v_id;
    delete from public.orcamento_itens where orcamento_id = v_id;
  end if;

  insert into public.orcamento_itens (orcamento_id, produto_id, nome, quantidade, preco_unitario, total, notas)
  select v_id, produto_id, nome, quantidade, preco_unitario, total, notas
  from jsonb_populate_recordset(null::public.orcamento_itens, p_itens);

  return v_id::text;
end;
$$;

create or replace function public.ateliedare_excluir_orcamento(p_id text)
returns void
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_id public.orcamentos.id%type := p_id;
begin
  if not public.ateliedare_admin() then raise exception 'Acesso restrito' using errcode = '42501'; end if;

  perform 1 from public.orcamentos where id = v_id for update;
  delete from public.orcamento_itens where orcamento_id = v_id;
  delete from public.orcamentos where id = v_id;
end;
$$;

create or replace function public.ateliedare_health()
returns boolean
language sql stable security invoker
set search_path = ''
as $$ select true; $$;

revoke all on function public.ateliedare_compartilhar_orcamento(text),
  public.ateliedare_salvar_produto(text, jsonb, jsonb, uuid), public.ateliedare_excluir_produto(text),
  public.ateliedare_salvar_orcamento(text, jsonb, jsonb, uuid), public.ateliedare_excluir_orcamento(text),
  public.ateliedare_orcamento_publico(uuid), public.ateliedare_health() from public, anon, authenticated;

grant execute on function public.ateliedare_compartilhar_orcamento(text),
  public.ateliedare_salvar_produto(text, jsonb, jsonb, uuid), public.ateliedare_excluir_produto(text),
  public.ateliedare_salvar_orcamento(text, jsonb, jsonb, uuid), public.ateliedare_excluir_orcamento(text)
  to authenticated;
grant execute on function public.ateliedare_orcamento_publico(uuid), public.ateliedare_health() to anon, authenticated;

notify pgrst, 'reload schema';
commit;
