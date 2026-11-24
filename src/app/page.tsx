import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, HeartHandshake, MessageCircle, Scissors, Shirt, Sparkles } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/contact";

const services = [
  { title: "Presentes personalizados", text: "Nomes, iniciais e desenhos bordados para marcar ocasiões especiais.", icon: Sparkles },
  { title: "Enxovais e maternidade", text: "Bordados delicados em toalhas, mantas e outras peças do enxoval.", icon: HeartHandshake },
  { title: "Uniformes e empresas", text: "Seu logotipo bordado em peças de trabalho e artigos promocionais.", icon: Shirt },
];

export default function LandingPage() {
  const whatsapp = getWhatsAppUrl();

  return (
    <div className="atelier-site">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header">
        <div className="site-container site-header-inner">
          <Link href="/" className="site-brand">
            <Image src="/icon-192.png" alt="" width={40} height={40} />
            Ateliê da Rê
          </Link>
          <nav aria-label="Navegação principal" className="site-nav">
            <a href="#bordados">Bordados</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#contato" className="site-button site-secondary">Contato</a>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        <section className="site-container site-hero">
          <div className="site-hero-copy">
            <p className="site-kicker"><Scissors size={15} aria-hidden /> Bordado eletrônico personalizado</p>
            <h1>Bordados que<br className="hidden sm:block" /> contam <em>histórias.</em></h1>
            <p className="site-intro">Seu nome, sua arte ou sua marca, bordados em peças para presentear, vestir e guardar.</p>
            <div className="site-actions">
              <a href={whatsapp ?? "#contato"} className="site-button site-primary">
                <MessageCircle size={19} aria-hidden /> Solicitar orçamento
              </a>
              <a href="#bordados" className="site-text-link">
                Ver opções <ArrowDown size={16} aria-hidden />
              </a>
            </div>
          </div>
          <figure className="site-hero-photo">
            <picture className="absolute inset-0">
              <source media="(max-width: 560px)" srcSet="/bordado-atelie-mobile.webp" />
              <Image
                src="/bordado-atelie.webp"
                alt="Bastidor de madeira com bordado floral em linho e carretéis de linha"
                fill
                unoptimized
                fetchPriority="high"
              />
            </picture>
            <figcaption>Imagem ilustrativa</figcaption>
          </figure>
        </section>

        <section id="bordados" className="site-services">
          <div className="site-container">
            <h2>O que podemos bordar</h2>
            <div className="site-cards">
              {services.map(({ title, text, icon: Icon }) => (
                <article key={title} className="site-card">
                  <div className="site-card-icon"><Icon size={22} aria-hidden /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="site-container site-process">
          <div>
            <h2>Da sua ideia ao bordado</h2>
            <p>Combine os detalhes do pedido antes de começar a produção.</p>
          </div>
          <ol>
            <li><h3>Conte o que você imagina</h3><p>Envie o nome, a referência ou o arquivo da arte.</p></li>
            <li><h3>Defina as peças</h3><p>Informe o tecido, o tamanho do bordado e a quantidade.</p></li>
            <li><h3>Confirme seu pedido</h3><p>Combine o valor e o prazo de entrega com o ateliê.</p></li>
          </ol>
        </section>

        <section id="contato" className="site-container site-contact-wrap">
          <div className="site-contact">
            <div>
              <h2>Vamos bordar sua ideia?</h2>
              <p>{whatsapp
                ? "Conte sobre o seu projeto e receba um orçamento personalizado."
                : "O contato comercial do ateliê será disponibilizado aqui."}</p>
            </div>
            {whatsapp && (
              <a href={whatsapp} className="site-button site-contact-button">
                Falar pelo WhatsApp <ArrowRight size={18} aria-hidden />
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-container">
          <span>Ateliê da Rê</span>
          <Link href="/precificacao" prefetch={false}>Acesso ao painel <ArrowRight size={15} aria-hidden /></Link>
        </div>
      </footer>
    </div>
  );
}
