"use client";

import Link from "next/link";
import { 
  Heart, 
  ShoppingBag, 
  Scissors, 
  MessageCircle,
  ChevronRight,
  Star,
  Camera,
  Paintbrush,
  Check,
  ChevronDown,
  Globe,
  Send,
  Sparkles,
  Cpu,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";

import Image from "next/image";
import logo from "./icon.png";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const whatsappUrl = "https://wa.me/5500000000000"; // Substituir pelo número real

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2D2D] font-sans selection:bg-[#E5989B]/30 overflow-x-hidden">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#F0E6E6] px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 relative overflow-hidden rounded-full shadow-sm border border-[#F0E6E6] bg-white flex items-center justify-center"
            >
              <Image 
                src={logo} 
                alt="Logo Ateliê da Rê" 
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-[#2D2D2D]">Ateliê da Rê</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <a href="#sobre" className="hidden md:block text-sm font-bold text-[#6D6D6D] hover:text-[#E5989B] transition-colors">Sobre</a>
            <a href="#portfolio" className="hidden md:block text-sm font-bold text-[#6D6D6D] hover:text-[#E5989B] transition-colors">Portfólio</a>
            <a 
              href={whatsappUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#E5989B] text-white px-6 py-2.5 rounded-full hover:bg-[#d48588] transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full bg-[#F8EDEB] relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-[#FAF7F2]/40 to-[#FAF7F2]" />
            <div className="w-full h-full border-4 border-dashed border-[#E5989B]/10 flex items-center justify-center text-[#E5989B]/10">
              <Cpu size={120} strokeWidth={1} />
              <span className="text-4xl font-bold ml-4 hidden md:block">Bordado Eletrônico de Precisão</span>
            </div>
          </div>
        </div>

        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center space-y-10 relative z-10"
        >
          <motion.div 
            variants={fadeIn}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white/90 backdrop-blur-sm border border-[#F0E6E6] rounded-full text-[#E5989B] text-xs font-bold uppercase tracking-widest shadow-sm"
          >
            <Sparkles size={14} fill="currentColor" className="animate-pulse" />
            <span>Tecnologia e Arte em Bordado</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1 
              variants={fadeIn}
              className="text-6xl md:text-9xl font-bold leading-tight tracking-tighter"
            >
              Bordados <br />
              <span className="text-[#E5989B] italic font-serif">Eletrônicos</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-lg md:text-2xl text-[#6D6D6D] max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Transformamos logos, nomes e artes digitais em bordados de alta definição com precisão milimétrica.
            </motion.p>
          </div>

          <motion.div 
            variants={fadeIn}
            className="pt-4"
          >
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex py-5 px-12 bg-[#E5989B] text-white font-extrabold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all items-center justify-center gap-3 text-xl"
            >
              <MessageCircle size={28} />
              Orçamento Personalizado
            </a>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold text-[#E5989B] uppercase tracking-[0.3em] animate-pulse">Conheça nosso trabalho</span>
          <div className="animate-bounce">
            <ChevronDown size={32} className="text-[#E5989B]" />
          </div>
        </motion.div>
      </section>

      {/* Portfolio Gallery */}
      <section id="portfolio" className="py-24 bg-white overflow-hidden">
        <div className="px-6 mb-16 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Galeria de Bordados</h2>
            <p className="text-[#6D6D6D] text-lg md:text-xl max-w-xl">
              Confira a precisão e o acabamento dos nossos bordados eletrônicos em diferentes tecidos.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pb-12 snap-x snap-mandatory flex gap-6 px-6 scrollbar-hide no-scrollbar">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div 
              key={item}
              className="w-[280px] md:w-[450px] shrink-0 aspect-[4/5] bg-[#FAF7F2] rounded-[40px] border border-[#F0E6E6] flex items-center justify-center relative overflow-hidden group snap-center"
            >
              <Layers size={48} className="text-[#E5989B]/20 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#E5989B]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-8 left-8 right-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white font-bold text-xl uppercase tracking-wider drop-shadow-md">Projeto Digital #{item}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Specialties */}
      <section id="produtos" className="py-24 px-6 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Personalização Individual", icon: <Star size={24} />, desc: "Nomes e artes exclusivas para enxovais, uniformes e presentes." },
              { title: "Bordado Corporativo", icon: <Cpu size={24} />, desc: "Digitalização e bordado de logos com alta fidelidade à sua marca." },
              { title: "Enxoval Maternidade", icon: <ShoppingBag size={24} />, desc: "Personalização delicada para momentos inesquecíveis." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white rounded-[48px] shadow-sm border border-[#F0E6E6] hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-16 h-16 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#E5989B] mb-8">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-[#6D6D6D] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="sobre" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">Precisão em <br /> cada ponto</h2>
            <p className="text-xl text-[#6D6D6D] leading-relaxed">
              Utilizamos as melhores máquinas e softwares de digitalização do mercado para garantir que seu projeto seja executado com perfeição.
            </p>
            <div className="grid gap-4">
              {[
                "Digitalização profissional de matrizes",
                "Acabamento limpo e duradouro",
                "Grande variedade de cores e fios",
                "Entrega rápida e garantida"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[#E5989B] rounded-full flex items-center justify-center text-white shrink-0">
                    <Check size={18} strokeWidth={3} />
                  </div>
                  <span className="font-bold text-[#2D2D2D]">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          <div className="aspect-square bg-[#F8EDEB] rounded-[60px] border-4 border-white shadow-2xl relative overflow-hidden flex items-center justify-center">
            <Cpu size={80} className="text-[#E5989B]/20" />
            <div className="absolute inset-0 border-[16px] border-white/40 pointer-events-none" />
            <span className="absolute bottom-10 text-[#E5989B] font-serif italic text-2xl">Tecnologia Têxtil</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#FAF7F2]">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-[#E5989B] rounded-[60px] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl md:text-7xl font-bold leading-tight">Envie sua arte <br /> para bordar</h2>
            <p className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
              Trabalhamos com diversos formatos de arquivos e tipos de tecidos. Solicite seu orçamento!
            </p>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-12 py-6 bg-white text-[#E5989B] font-extrabold rounded-[32px] shadow-xl text-xl"
            >
              <MessageCircle size={28} />
              Enviar Arte no WhatsApp
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 px-6 border-t border-[#F0E6E6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 relative overflow-hidden rounded-full shadow-md border border-[#F0E6E6] bg-white flex items-center justify-center">
                  <Image src={logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-3xl font-bold text-[#2D2D2D]">Ateliê da Rê</span>
              </div>
              <p className="text-lg text-[#6D6D6D] max-w-sm text-center md:text-left">
                Bordados eletrônicos de alta precisão. Qualidade e tecnologia a serviço da sua criatividade.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <p className="font-bold text-[#2D2D2D] uppercase tracking-widest text-sm">Fale Conosco</p>
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-8 py-4 bg-[#FAF7F2] rounded-2xl border border-[#F0E6E6] hover:bg-[#E5989B] hover:text-white transition-all group"
              >
                <MessageCircle size={24} className="text-[#E5989B] group-hover:text-white transition-colors" />
                <span className="font-bold">(00) 99999-0000</span>
              </a>
            </div>
          </div>
          
          <div className="pt-12 border-t border-[#F0E6E6] flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[#9E9E9E] font-medium italic">
              © {new Date().getFullYear()} Ateliê da Rê. Bordando tecnologia com afeto.
            </p>
            <div className="flex gap-8 text-[#9E9E9E] text-sm font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-[#E5989B] transition-colors">Privacidade</a>
              <a href="#" className="hover:text-[#E5989B] transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
