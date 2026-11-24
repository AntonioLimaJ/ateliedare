# Ateliê da Rê

Site de bordados personalizados e painel interno para precificar produtos, acompanhar custos e emitir orçamentos.

## Desenvolvimento local

Use Node.js 22 ou superior. Copie `.env.example` para `.env.local` e preencha a URL e a chave **publishable** do projeto Supabase. Projetos que ainda usam a chave **anon** podem configurá-la em `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```sh
npm ci
npm run dev
npm run lint
npm run build
```

A página pública funciona sem Supabase. O painel em `/precificacao` exige uma conta de equipe. A variável opcional `ATELIE_WHATSAPP_NUMBER` substitui o número comercial padrão e deve conter DDI, DDD e telefone, só com dígitos.

## Atualização do Supabase e do site

1. Identifique o projeto Supabase vinculado ao site e valide a migração em uma cópia de desenvolvimento do banco. Ela parte das tabelas do ateliê já existentes e preserva seus registros.
2. Crie ou confirme as contas da equipe em **Authentication → Users**. Pelo Admin SDK ou outro fluxo administrativo do Supabase, preserve os campos atuais de `app_metadata` e defina `ateliedare_admin` como o booleano `true` nas contas da equipe. Desative o cadastro público caso esse projeto seja exclusivo do painel. Usuários com sessões anteriores devem sair e entrar novamente para renovar a permissão.
3. Prepare o deploy com `NEXT_PUBLIC_SUPABASE_URL` e a chave pública. Aplique a migração `supabase/migrations/202611240001_painel_e_orcamentos.sql` junto com a publicação do site. Durante a troca entre as versões, o painel antigo pode ficar temporariamente indisponível. Nenhuma chave administrativa deve ser usada pelo site.
4. Valide o acesso de uma conta da equipe, o bloqueio de uma conta comum, as fotos no bucket público `precificacao` e os fluxos de produto e orçamento. Se o projeto usa Realtime, confirme que `produtos` e `materiais` fazem parte da publicação `supabase_realtime`. Ao recuperar o foco ou a internet, o painel também relê a lista sem depender do WebSocket.

O compartilhamento parte de **Orçamentos → Copiar link**. Cada link é válido por sete dias a partir da emissão. Links antigos associados diretamente ao identificador interno devem ser substituídos por um link novo.

## Disponibilidade do Supabase

O workflow **Disponibilidade do Supabase** faz três consultas leves por dia à função `ateliedare_health`, que só retorna um booleano. Nas configurações do repositório, em **Secrets and variables → Actions**, defina `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Use a chave publishable, ou a chave anon legada. Com o workflow na branch padrão, execute **Run workflow** e confirme a resposta.

O GitHub pode desativar agendamentos de repositórios públicos após 60 dias sem atividade. Se precisar manter o monitoramento independente do GitHub, use um monitor externo com uma requisição POST periódica para `/rest/v1/rpc/ateliedare_health`, com o cabeçalho `apikey`, `Content-Type: application/json` e corpo `{}`. Para chave anon JWT, envie também `Authorization: Bearer <chave anon>`.

Em projetos Free, as consultas periódicas reduzem o risco de pausa por inatividade. Se o projeto já estiver pausado, retome-o primeiro pelo painel do Supabase. Planos pagos são isentos da pausa automática por inatividade. [Política de pausa do Supabase](https://supabase.com/docs/guides/platform/free-project-pausing)
