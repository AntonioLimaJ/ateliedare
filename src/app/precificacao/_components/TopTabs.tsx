"use client";

interface TopTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "produtos", label: "Produtos" },
  { id: "materiais", label: "Materiais" },
  { id: "custos", label: "Custos fixos" },
];

export function TopTabs({ activeTab, onTabChange }: TopTabsProps) {
  return (
    <div aria-label="Seções da precificação" role="group" className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-[#e9dcd4] bg-[#f1e7df] p-1">
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} type="button" aria-pressed={active} onClick={() => onTabChange(tab.id)}
            className={`min-h-11 rounded-lg px-1 text-sm font-semibold transition-colors ${active ? "bg-white text-[#793751] shadow-sm" : "text-[#695850] hover:text-[#29201f]"}`}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
