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
    <div className="flex bg-[#F8EDEB] p-1 rounded-xl gap-1 mx-4 mb-6 border border-[#F0E6E6]">
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
                ? "bg-white text-[#E5989B] shadow-sm"
                : "text-[#9E9E9E] hover:text-[#6D6D6D]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}