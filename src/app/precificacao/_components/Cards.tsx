import { Heart, MoreVertical } from "lucide-react";
import Image from "next/image";

interface ProductCardProps {
  title: string;
  price: string;
  subtitle: string;
  imageUrl?: string;
}

export function ProductCard({ title, price, subtitle, imageUrl }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-[#F0E6E6] mb-3 mx-4 hover:shadow-md transition-shadow">
      <div className="w-16 h-16 bg-[#FAF7F2] rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#F0E6E6]">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} width={64} height={64} className="object-cover" />
        ) : (
          <div className="text-[#D4A5A5] font-bold text-xl">{title[0]}</div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#2D2D2D] truncate">{title}</h3>
        <p className="text-sm text-[#6D6D6D] truncate">{subtitle}</p>
        <p className="text-[#E5989B] font-bold mt-1">{price}</p>
      </div>

      <div className="flex flex-col gap-2">
        <button className="text-[#9E9E9E] hover:text-[#E5989B]">
          <Heart size={20} />
        </button>
        <button className="text-[#9E9E9E] hover:text-[#2D2D2D]">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}

export function SummaryCard({ label, value, type = "primary" }: { label: string; value: string; type?: "primary" | "secondary" }) {
  const isPrimary = type === "primary";
  return (
    <div className={`p-6 rounded-3xl mx-4 mb-6 ${isPrimary ? "bg-[#E5989B] text-white shadow-lg shadow-[#E5989B]/20" : "bg-white border border-[#F0E6E6] text-[#2D2D2D] shadow-sm"}`}>
      <p className={`text-sm font-medium ${isPrimary ? "text-white/80" : "text-[#6D6D6D]"}`}>{label}</p>
      <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
    </div>
  );
}
