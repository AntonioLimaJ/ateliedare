"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Package, Calendar, User, CheckCircle2, DollarSign, Truck, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function ViewOrcamento() {
  const { id } = useParams();
  const [orcamento, setOrcamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrcamento();
  }, [id]);

  const fetchOrcamento = async () => {
    try {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          clientes (nome),
          orcamento_itens (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrcamento(data);
    } catch (error) {
      console.error("Erro ao buscar orçamento:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Package size={40} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-[#2D2D2D]">Orçamento não encontrado</h1>
        <p className="text-sm text-[#9E9E9E] mt-2">O link pode estar expirado ou incorreto.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2D2D] font-sans selection:bg-[#E5989B]/30 pb-12 print:bg-white print:pb-0">
      {/* Header fixo para o cliente (escondido no print) */}
      <header className="bg-white border-b border-[#F0E6E6] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F8EDEB] flex items-center justify-center">
            <img src="/icon.png" alt="Logo" className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#2D2D2D] leading-tight">Ateliê da Re</h1>
            <p className="text-[10px] font-medium text-[#E5989B] uppercase tracking-wider">Orcamento de Pedido</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="w-10 h-10 rounded-full bg-[#E5989B] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Download size={20} />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 pt-8 space-y-6 print:pt-0">
        {/* Card Principal */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 shadow-xl border border-[#F0E6E6] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F8EDEB] rounded-bl-full -mr-16 -mt-16 opacity-50" />
          
          <div className="flex justify-between items-start mb-8 relative">
            <div>
              <span className="bg-[#F8EDEB] text-[#E5989B] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                #{orcamento.id.slice(0, 8)}
              </span>
              <h2 className="text-3xl font-black text-[#2D2D2D] mt-2 tracking-tight">Orçamento</h2>
              <p className="text-[#9E9E9E] text-sm mt-1">{new Date(orcamento.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">Total do Pedido</p>
              <p className="text-3xl font-black text-[#E5989B]">R$ {orcamento.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#F0E6E6]/50">
              <div className="flex items-center gap-2 mb-2 text-[#E5989B]">
                <User size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cliente</span>
              </div>
              <p className="font-bold text-[#2D2D2D]">{orcamento.clientes?.nome || orcamento.nome_cliente_manual}</p>
            </div>
            <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#F0E6E6]/50">
              <div className="flex items-center gap-2 mb-2 text-[#E5989B]">
                <Calendar size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Previsão de Entrega</span>
              </div>
              <p className="font-bold text-[#2D2D2D]">
                {orcamento.data_entrega ? new Date(orcamento.data_entrega).toLocaleDateString("pt-BR") : "A combinar"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#2D2D2D] uppercase tracking-widest px-2">Itens Solicitados</h3>
            <div className="space-y-3">
              {orcamento.orcamento_itens?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 bg-white border border-[#F0E6E6] p-4 rounded-3xl group hover:border-[#E5989B]/30 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8EDEB] flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-[#E5989B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#2D2D2D] text-sm truncate">{item.nome}</h4>
                    <p className="text-xs text-[#9E9E9E]">{item.quantidade} unidade(s)</p>
                    {item.notas && <p className="text-[11px] text-[#6D6D6D] mt-1 italic leading-relaxed">"{item.notas}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#2D2D2D]">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-[#9E9E9E]">un. R$ {item.preco_unitario.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer info */}
        <section className="text-center space-y-4 px-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
            <CheckCircle2 size={14} />
            Este orçamento é válido por 7 dias
          </div>
          <p className="text-[11px] text-[#9E9E9E] leading-relaxed">
            Obrigado por escolher o Ateliê da Re!<br/>
            Para confirmar seu pedido, entre em contato através do nosso WhatsApp.
          </p>
        </section>
      </main>

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .min-h-screen { min-height: auto !important; }
          header { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          section { box-shadow: none !important; border: 1px solid #F0E6E6 !important; border-radius: 20px !important; }
        }
      `}</style>
    </div>
  );
}
