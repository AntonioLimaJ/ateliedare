"use client";

import { Calculator, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: Calculator, label: "Precificar", href: "/precificacao" },
  { icon: DollarSign, label: "Orçamentos", href: "/precificacao/Orcamentos" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0E6E6] px-2 pb-safe shadow-2xl">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/precificacao" && pathname === "/precificacao");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${isActive ? "text-[#E5989B]" : "text-[#9E9E9E] hover:text-[#6D6D6D]"
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
