"use client";

import { useState, useEffect } from "react";
import { Plus, Search, User, Lock, Star, Package, Pencil, Trash, Calendar, CheckCircle2, Circle, DollarSign, Truck, ChevronDown, ChevronUp, Share2, ArrowRight } from "lucide-react";
import { BottomNav } from "./../_components/BottomNav";
import { TopTabs } from "./../_components/TopTabs";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toPng } from "html-to-image";
import { useRef } from "react";
import { Download as DownloadIcon } from "lucide-react";

export default function PrecificacaoDashboard() {
    const router = useRouter();
    const ticketRef = useRef<HTMLDivElement>(null);
    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchOrcamentos();
    }, []);

    const handleShareImage = async (orc: any) => {
        setSharingId(orc.id);

        // Pequeno delay para garantir que o elemento oculto renderizou com os dados do orc
        setTimeout(async () => {
            if (!ticketRef.current) return;

            try {
                const dataUrl = await toPng(ticketRef.current, {
                    quality: 0.95,
                    backgroundColor: "#FAF7F2",
                    pixelRatio: 2 // Alta qualidade
                });

                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], `orcamento-${orc.id.slice(0, 5)}.png`, { type: 'image/png' });

                // Tentar copiar para a área de transferência (Ctrl+V)
                try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    console.log("Imagem copiada para o clipboard");
                } catch (err) {
                    console.log("Não foi possível copiar para o clipboard:", err);
                }

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Orçamento - ${orc.clientes?.nome || orc.nome_cliente_manual}`,
                        text: `Olá! Segue o orçamento do Ateliê da Rê.`
                    });
                } else {
                    // Download automático se não conseguir compartilhar
                    const link = document.createElement('a');
                    link.download = `orcamento-${orc.clientes?.nome || 'cliente'}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            } catch (err) {
                console.error('Erro ao gerar imagem:', err);
                alert("Erro ao gerar imagem. Tente novamente.");
            } finally {
                setSharingId(null);
            }
        }, 100);
    };

    const handleDownloadImage = async (orc: any) => {
        setSharingId(orc.id);
        setTimeout(async () => {
            if (!ticketRef.current) return;
            try {
                const dataUrl = await toPng(ticketRef.current, { quality: 0.95, backgroundColor: "#FAF7F2", pixelRatio: 2 });
                const link = document.createElement('a');
                link.download = `orcamento-${orc.clientes?.nome || 'cliente'}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error('Erro ao baixar:', err);
            } finally {
                setSharingId(null);
            }
        }, 100);
    };

    const handleShare = async (orc: any) => {
        const url = `${window.location.origin}/view/${orc.id}`;
        const text = `Olá! Aqui está o orçamento do Ateliê da Rê: ${url}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Orçamento - Ateliê da Rê',
                    text: text,
                    url: url
                });
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
            }
        } else {
            // Fallback para cópia manual
            navigator.clipboard.writeText(text);
            alert("Link copiado para a área de transferência!");
        }
    };

    const toggleStatus = async (id: string, field: string, value: boolean) => {
        try {
            const { error } = await supabase
                .from("orcamentos")
                .update({ [field]: value })
                .eq("id", id);

            if (error) throw error;

            setOrcamentos(orcamentos.map(orc =>
                orc.id === id ? { ...orc, [field]: value } : orc
            ));
        } catch (error) {
            console.error(`Erro ao atualizar ${field}:`, error);
        }
    };

    const fetchOrcamentos = async () => {
        try {
            const { data, error } = await supabase
                .from("orcamentos")
                .select(`
                    *,
                    clientes (nome),
                    orcamento_itens (
                        *,
                        produtos (imagem_url)
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrcamentos(data || []);
        } catch (error) {
            console.error("Erro ao buscar orçamentos:", error);
        } finally {
            setLoading(false);
        }
    };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const isProximo = (dataEntrega: string) => {
        if (!dataEntrega) return false;
        const entrega = new Date(dataEntrega);
        const diffTime = entrega.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    };

    const matchesSearch = (orc: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const clienteNome = (orc.clientes?.nome || orc.nome_cliente_manual || "").toLowerCase();
        const matchesCliente = clienteNome.includes(query);
        const matchesItens = orc.orcamento_itens?.some((it: any) => it.nome.toLowerCase().includes(query));
        return matchesCliente || matchesItens;
    };

    const orcamentosFiltrados = orcamentos.filter(matchesSearch);

    const totalValor = orcamentosFiltrados.reduce((acc, orc) => acc + (orc.total || 0), 0);
    const totalPago = orcamentosFiltrados.filter(orc => orc.pago).reduce((acc, orc) => acc + (orc.total || 0), 0);

    const concluidos = orcamentosFiltrados.filter(orc => orc.entregue && orc.pago);
    const pagamentoPendente = orcamentosFiltrados.filter(orc => orc.entregue && !orc.pago);
    const emProducaoTotais = orcamentosFiltrados.filter(orc => !orc.entregue);

    const proximos = emProducaoTotais.filter(orc => orc.data_entrega && isProximo(orc.data_entrega));
    const pendentes = emProducaoTotais.filter(orc => !proximos.find(p => p.id === orc.id));

    const BudgetCard = ({ orc }: { orc: any }) => {
        const urgente = isProximo(orc.data_entrega) && !orc.entregue;

        return (
            <div key={orc.id} className="relative">
                <div
                    onClick={() => setExpandedId(expandedId === orc.id ? null : orc.id)}
                    className={`block bg-white border rounded-3xl p-5 shadow-sm transition-all cursor-pointer ${expandedId === orc.id ? 'border-[#E5989B] shadow-md ring-1 ring-[#E5989B]/10' : 'border-[#F0E6E6] hover:border-[#E5989B]/30'} ${urgente ? 'ring-1 ring-red-100 bg-red-50/10' : ''}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${urgente ? 'bg-red-50 text-red-500' : 'bg-[#F8EDEB] text-[#E5989B]'}`}>
                                <User size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-[#2D2D2D] text-sm leading-tight">
                                    {orc.clientes?.nome || orc.nome_cliente_manual || "Cliente não identificado"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <p className="text-[10px] text-[#9E9E9E] uppercase font-bold tracking-wider">
                                        {new Date(orc.created_at).toLocaleDateString("pt-BR")}
                                    </p>
                                    {orc.data_entrega && (
                                        <>
                                            <ArrowRight size={10} className="text-[#D1D1D1]" />
                                            <p className={`text-[10px] uppercase font-black tracking-wider ${urgente ? 'text-red-500 animate-pulse' : 'text-[#E5989B]'}`}>
                                                {new Date(orc.data_entrega).toLocaleDateString("pt-BR")}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-full border ${urgente ? 'bg-red-50 border-red-100' : 'bg-[#FAF7F2] border-[#F0E6E6]'}`}>
                                <span className={`text-xs font-bold ${urgente ? 'text-red-600' : 'text-[#E5989B]'}`}>
                                    R$ {orc.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedId(expandedId === orc.id ? null : orc.id);
                                }}
                                className="p-1 hover:bg-[#F8EDEB] rounded-full transition-colors"
                            >
                                {expandedId === orc.id ? <ChevronUp size={20} className={urgente ? "text-red-400" : "text-[#E5989B]"} /> : <ChevronDown size={20} className="text-[#9E9E9E]" />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedId === orc.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="py-4 space-y-3 border-t border-[#F0E6E6]/50 mt-4">
                                    <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">Itens do Orçamento</p>
                                    {orc.orcamento_itens?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center bg-[#FAF7F2] p-3 rounded-2xl border border-[#F0E6E6]/50">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[#2D2D2D]">{item.quantidade}x {item.nome}</span>
                                                {item.notas && <span className="text-[10px] text-[#6D6D6D] italic line-clamp-1">{item.notas}</span>}
                                            </div>
                                            <span className="text-xs font-bold text-[#6D6D6D]">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/precificacao/orcamentos/novo?id=${orc.id}`);
                                            }}
                                            className="flex-1 py-3 bg-[#F8EDEB] text-[#E5989B] rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                        >
                                            <Pencil size={14} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShareImage(orc);
                                            }}
                                            disabled={sharingId === orc.id}
                                            className={`flex-1 py-3 bg-[#E5989B] text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-opacity ${sharingId === orc.id ? 'opacity-50' : ''}`}
                                        >
                                            {sharingId === orc.id ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Share2 size={14} />
                                                    Enviar/Copiar
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownloadImage(orc); }}
                                            className="w-12 h-12 bg-[#F8EDEB] text-[#E5989B] rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                            title="Baixar Imagem"
                                        >
                                            <DownloadIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F0E6E6]/50">
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleStatus(orc.id, 'entregue', !orc.entregue); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${orc.entregue ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-[#F0E6E6] text-[#9E9E9E]'}`}
                            >
                                <Truck size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{orc.entregue ? 'Entregue' : 'Entregar'}</span>
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggleStatus(orc.id, 'pago', !orc.pago); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${orc.pago ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white border-[#F0E6E6] text-[#9E9E9E]'}`}
                            >
                                <DollarSign size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{orc.pago ? 'Pago' : 'Pagar'}</span>
                            </button>
                        </div>

                        {orc.data_entrega && (
                            <div className={`flex items-center gap-1 ${urgente ? 'text-red-500' : 'text-[#6D6D6D]'}`}>
                                <Calendar size={12} className={urgente ? "text-red-500" : "text-[#E5989B]"} />
                                <span className="text-[10px] font-black">{new Date(orc.data_entrega).toLocaleDateString("pt-BR")}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#2D2D2D] pb-24 font-sans antialiased selection:bg-[#E5989B]/30">
            <header className="sticky top-0 z-40 bg-white border-b border-[#F0E6E6] px-6 py-4 flex items-center justify-between shadow-lg h-20">
                <AnimatePresence mode="wait">
                    {!isSearching ? (
                        <motion.div
                            key="logo"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#F8EDEB] flex items-center justify-center overflow-hidden">
                                <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-[#2D2D2D] leading-tight">Ateliê da Re</h1>
                                <p className="text-[11px] font-medium text-[#E5989B] uppercase tracking-widest">Bordados Eletrônicos</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "100%" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-2 flex-1 mr-4"
                        >
                            <div className="relative flex-1">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Pesquisar por cliente ou produto..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 bg-[#FAF7F2] border border-[#F0E6E6] rounded-2xl px-12 text-sm focus:outline-none focus:border-[#E5989B] transition-all"
                                />
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => {
                        setIsSearching(!isSearching);
                        if (isSearching) setSearchQuery("");
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSearching ? 'bg-[#2D2D2D] text-white' : 'bg-[#F8EDEB] text-[#6D6D6D]'}`}
                >
                    {isSearching ? <Plus size={20} className="rotate-45" /> : <Search size={20} />}
                </button>
            </header>

            <main className="pt-6 px-4 space-y-8">
                <div className="p-6 rounded-3xl bg-[#E5989B] text-white shadow-xl shadow-[#E5989B]/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-white/90">Valor Total</p>
                            <p className="text-2xl font-bold mt-1 tracking-tight">
                                R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-white/90">Já Pago</p>
                            <p className="text-xl font-bold mt-1 tracking-tight text-white">
                                R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-white/80 mt-4 pt-4 border-t border-white/20">{orcamentos.length} orçamentos registrados</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {orcamentosFiltrados.length === 0 && searchQuery && (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <div className="w-20 h-20 bg-[#F8EDEB] rounded-full flex items-center justify-center mb-6">
                                    <Search size={32} className="text-[#E5989B]" />
                                </div>
                                <h3 className="text-lg font-bold text-[#2D2D2D]">Nenhum resultado</h3>
                                <p className="text-sm text-[#9E9E9E] mt-2 mb-8">Não encontramos nada para "{searchQuery}". Tente outro termo.</p>
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="px-8 py-3 bg-[#E5989B] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
                                >
                                    Limpar pesquisa
                                </button>
                            </div>
                        )}

                        {proximos.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-red-500">Próximos da Entrega</h2>
                                        <span className="animate-ping w-2 h-2 rounded-full bg-red-500" />
                                    </div>
                                    <span className="bg-red-50 text-red-500 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                                        {proximos.length} URGENTE
                                    </span>
                                </div>
                                {proximos.map(orc => <BudgetCard key={orc.id} orc={orc} />)}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-bold">Em Produção</h2>
                                <span className="bg-[#F8EDEB] text-[#E5989B] text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                                    {pendentes.length}
                                </span>
                            </div>

                            {pendentes.length === 0 && proximos.length === 0 && pagamentoPendente.length === 0 && concluidos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-[#9E9E9E]">
                                    <div className="w-16 h-16 rounded-full bg-[#F8EDEB] flex items-center justify-center mb-4">
                                        <Package size={32} className="text-[#E5989B]" />
                                    </div>
                                    <p className="text-sm font-medium text-[#2D2D2D]">Nenhum orçamento ainda</p>
                                    <p className="text-xs text-[#9E9E9E] mt-1">Toque no + para criar seu primeiro orçamento</p>
                                </div>
                            ) : pendentes.length === 0 && proximos.length === 0 && (pagamentoPendente.length > 0 || concluidos.length > 0) ? (
                                <div className="text-center py-8 bg-white/50 rounded-3xl border border-dashed border-[#F0E6E6]">
                                    <p className="text-xs text-[#9E9E9E]">Nada em produção no momento! 🧵</p>
                                </div>
                            ) : (
                                pendentes.map((orc) => <BudgetCard key={orc.id} orc={orc} />)
                            )}
                        </div>

                        {pagamentoPendente.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-amber-600">Pagamento Pendente</h2>
                                        <DollarSign size={18} className="text-amber-500" />
                                    </div>
                                    <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                                        {pagamentoPendente.length} ENTREGUES
                                    </span>
                                </div>
                                {pagamentoPendente.map(orc => <BudgetCard key={orc.id} orc={orc} />)}
                            </div>
                        )}

                        {concluidos.length > 0 && (
                            <div className="space-y-4 opacity-70 grayscale-[0.5]">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-lg font-bold text-[#6D6D6D]">Concluídos</h2>
                                    <CheckCircle2 size={18} className="text-green-500" />
                                </div>

                                {concluidos.map((orc) => (
                                    <div
                                        key={orc.id}
                                        onClick={() => expandedId === orc.id ? setExpandedId(null) : setExpandedId(orc.id)}
                                        className="block bg-white/50 border border-[#F0E6E6] rounded-3xl p-5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-[#F0E6E6] flex items-center justify-center">
                                                    <CheckCircle2 size={18} className="text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#6D6D6D] text-sm line-through">
                                                        {orc.clientes?.nome || orc.nome_cliente_manual || "Cliente"}
                                                    </p>
                                                    <p className="text-[10px] text-[#9E9E9E] font-bold">Concluído em {new Date(orc.created_at).toLocaleDateString("pt-BR")}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-[#9E9E9E]">R$ {orc.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        <AnimatePresence>
                                            {expandedId === orc.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="py-4 space-y-3 border-t border-[#F0E6E6]/50 mt-4">
                                                        {orc.orcamento_itens?.map((item: any) => (
                                                            <div key={item.id} className="flex justify-between items-center bg-[#FAF7F2] p-3 rounded-2xl">
                                                                <span className="text-xs font-bold text-[#6D6D6D]">{item.quantidade}x {item.nome}</span>
                                                                <span className="text-xs font-bold text-[#9E9E9E]">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/precificacao/orcamentos/novo?id=${orc.id}`);
                                                                }}
                                                                className="flex-1 py-3 border border-[#F0E6E6] text-[#6D6D6D] rounded-2xl text-[11px] font-bold uppercase flex items-center justify-center gap-2"
                                                            >
                                                                <Pencil size={14} />
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleShareImage(orc);
                                                                }}
                                                                disabled={sharingId === orc.id}
                                                                className={`flex-[3] py-3 bg-[#F8EDEB] text-[#E5989B] rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity ${sharingId === orc.id ? 'opacity-50' : ''}`}
                                                            >
                                                                {sharingId === orc.id ? (
                                                                    <div className="w-4 h-4 border-2 border-[#E5989B]/20 border-t-[#E5989B] rounded-full animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Share2 size={14} />
                                                                        Enviar/Copiar
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadImage(orc); }}
                                                                className="w-12 h-12 bg-white border border-[#F0E6E6] text-[#6D6D6D] rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                                                                title="Baixar Imagem"
                                                            >
                                                                <DownloadIcon size={18} />
                                                            </button>
                                                        </div>

                                                        <div className="flex gap-2 pt-2 border-t border-[#F0E6E6]/50 mt-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleStatus(orc.id, 'entregue', !orc.entregue); }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all bg-blue-50 border-blue-100 text-blue-600"
                                                            >
                                                                <Truck size={14} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Entregue</span>
                                                            </button>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleStatus(orc.id, 'pago', !orc.pago); }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all bg-green-50 border-green-100 text-green-600"
                                                            >
                                                                <DollarSign size={14} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Pago</span>
                                                            </button>
                                                            <p className="text-[10px] text-[#9E9E9E] ml-auto flex items-center italic">Toque para desmarcar</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <Link
                href="/precificacao/orcamentos/novo"
                className="fixed right-6 bottom-24 w-14 h-14 bg-[#E5989B] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#E5989B]/40 active:scale-95 transition-transform z-50"
            >
                <Plus size={28} />
            </Link>

            <BottomNav />

            <div className="fixed -left-[2000px] top-0 pointer-events-none">
                <div
                    ref={ticketRef}
                    className="w-[450px] bg-[#FAF7F2] p-8 font-sans"
                >
                    {orcamentos.find(o => o.id === sharingId) && (() => {
                        const orc = orcamentos.find(o => o.id === sharingId);

                        // Calcular desconto
                        const totalItens = orc.orcamento_itens?.reduce((acc: number, it: any) => acc + it.total, 0) || 0;
                        const valorDesconto = totalItens - orc.total;
                        const pctDesconto = totalItens > 0 ? (valorDesconto / totalItens) * 100 : 0;

                        return (
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-[#F0E6E6]">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#F8EDEB] flex items-center justify-center">
                                            <img src="/icon.png" alt="Logo" className="w-full h-full" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-[#E5989B] uppercase tracking-[0.2em]">Ateliê da Rê</h2>
                                            <p className="text-[10px] font-bold text-[#9E9E9E]">Bordados Eletrônicos</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest">Orçamento Nº</p>
                                        <p className="text-sm font-bold text-[#2D2D2D]">#{orc.id.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-[#FAF7F2] p-6 rounded-[32px] border border-[#F0E6E6]/50">
                                        <p className="text-[10px] font-black text-[#E5989B] uppercase tracking-widest mb-1">Dados do Cliente</p>
                                        <p className="text-xl font-black text-[#2D2D2D]">{orc.clientes?.nome || orc.nome_cliente_manual}</p>
                                        <p className="text-xs text-[#9E9E9E] mt-1">Emissão: {new Date(orc.created_at).toLocaleDateString("pt-BR")}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest px-2">Itens do Pedido</p>
                                    <div className="space-y-3">
                                        {orc.orcamento_itens?.map((item: any) => (
                                            <div key={item.id} className="flex gap-4 items-center bg-white border border-[#F0E6E6] p-4 rounded-3xl">
                                                <div className="w-14 h-14 rounded-2xl bg-[#F8EDEB] overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                    {(item.imagem_url || item.produtos?.imagem_url) ? (
                                                        <img src={item.imagem_url || item.produtos?.imagem_url} alt={item.nome} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                    ) : (
                                                        <Package size={20} className="text-[#E5989B]/40" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-[#2D2D2D] truncate">{item.nome}</p>
                                                    <p className="text-[11px] text-[#9E9E9E]">{item.quantidade}x R$ {item.preco_unitario.toLocaleString("pt-BR")}</p>
                                                    {item.notas && <p className="text-[10px] text-[#6D6D6D] italic mt-1 line-clamp-1">"{item.notas}"</p>}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-black text-[#2D2D2D]">R$ {item.total.toLocaleString("pt-BR")}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 bg-[#FAF7F2] p-6 rounded-[32px] border border-[#F0E6E6]/50">
                                    <div className="flex justify-between items-center text-xs text-[#6D6D6D] font-bold">
                                        <span>Subtotal dos itens</span>
                                        <span>R$ {totalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {valorDesconto > 0 && (
                                        <div className="flex justify-between items-center text-xs text-green-600 font-bold">
                                            <span>Desconto Aplicado ({pctDesconto.toFixed(0)}%)</span>
                                            <span>- R$ {valorDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-[#F0E6E6] flex justify-between items-center">
                                        <span className="text-sm font-black text-[#2D2D2D] uppercase tracking-widest">Total Final</span>
                                        <span className="text-2xl font-black text-[#E5989B]">R$ {orc.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {orc.data_entrega && (
                                    <div className="mt-6 flex items-center justify-center gap-2 text-[#9E9E9E]">
                                        <Calendar size={14} />
                                        <span className="text-[11px] font-bold">Entrega prevista: {new Date(orc.data_entrega).toLocaleDateString("pt-BR")}</span>
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-[#F0E6E6] text-center">
                                    <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">Ateliê da Rê</p>
                                    <p className="text-[10px] text-[#9E9E9E] mt-1">Obrigado por nos escolher para seus momentos especiais!</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
