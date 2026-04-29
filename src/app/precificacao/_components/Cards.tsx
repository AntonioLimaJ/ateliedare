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
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-zinc-100 mb-3 mx-4 hover:shadow-md transition-shadow">
      <div className="w-16 h-16 bg-pink-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-pink-100">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} width={64} height={64} className="object-cover" />
        ) : (
          <div className="text-pink-300 font-bold text-xl">{title[0]}</div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-zinc-900 truncate">{title}</h3>
        <p className="text-sm text-zinc-500 truncate">{subtitle}</p>
        <p className="text-pink-600 font-bold mt-1">{price}</p>
      </div>

      <div className="flex flex-col gap-2">
        <button className="text-zinc-300 hover:text-pink-400">
          <Heart size={20} />
        </button>
        <button className="text-zinc-300 hover:text-zinc-500">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}

export function SummaryCard({ label, value, type = "primary" }: { label: string; value: string; type?: "primary" | "secondary" }) {
  const isPrimary = type === "primary";
  return (
    <div className={`p-6 rounded-3xl mx-4 mb-6 ${isPrimary ? "bg-pink-500 text-white shadow-lg shadow-pink-200" : "bg-white border border-zinc-100 text-zinc-900 shadow-sm"}`}>
      <p className={`text-sm font-medium ${isPrimary ? "text-pink-100" : "text-zinc-500"}`}>{label}</p>
      <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
    </div>
  );
}
