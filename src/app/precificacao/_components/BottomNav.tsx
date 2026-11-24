"use client";

import { Calculator, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: Calculator, label: "Precificar", href: "/precificacao" },
  { icon: DollarSign, label: "Orçamentos", href: "/precificacao/orcamentos" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação do painel" className="fixed bottom-0 left-0 right-0 z-50 bg-[#fffdf9] border-t border-[#e9dcd4] px-2 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isBudget = pathname.startsWith("/precificacao/orcamentos");
          const isActive = item.href.endsWith("/orcamentos") ? isBudget : !isBudget;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? "text-[#793751]" : "text-[#695850] hover:text-[#29201f]"
                }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
