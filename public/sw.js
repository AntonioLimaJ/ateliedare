self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.delete("precificare-v2"),
    self.clients.claim(),
  ]));
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== self.location.origin) return;
  if (url.pathname !== "/precificacao" && !url.pathname.startsWith("/precificacao/")) return;

  event.respondWith(fetch(request).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Painel sem conexão</title><style>body{font:1rem system-ui;background:#faf6ef;color:#29201f;padding:10vw;max-width:32rem;margin:auto}a{color:#793751}</style><main><h1>Você está sem conexão</h1><p>Conecte-se à internet para acessar os dados do ateliê.</p><a href="/precificacao">Tentar novamente</a></main></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  )));
});
