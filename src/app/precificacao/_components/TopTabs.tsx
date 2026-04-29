"use client";

interface TopTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "produtos", label: "Produtos" },
  { id: "materiais", label: "Materiais" },
  { id: "custos", label: "Custos Fixos" },
];

export function TopTabs({ activeTab, onTabChange }: TopTabsProps) {
  return (
    <div className="flex bg-zinc-800/50 p-1 rounded-xl gap-1 mx-4 mb-6 border border-zinc-800/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onTouchEnd={(e) => {
              e.stopPropagation();
              onTabChange(tab.id);
            }}
            onClick={() => onTabChange(tab.id)}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
            className={`flex-1 py-3 text-sm font-bold transition-colors rounded-lg ${
              isActive
                ? "bg-zinc-700 text-purple-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}