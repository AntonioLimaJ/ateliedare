export type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  imagem_url?: string | null;
  preco_final: number;
  preco_sugerido?: number | null;
  favorito?: boolean;
  custo_materiais?: number | null;
  custo_trabalho?: number | null;
  tempo_trabalho?: number | null;
  margem_lucro?: number | null;
  rendimento?: number | null;
};

export type Etiqueta = { id: string; nome: string };
export type Cliente = { id: string; nome: string };

export type ItemOrcamento = {
  id?: string;
  produto_id: string | null;
  nome: string;
  imagem_url?: string | null;
  quantidade: number;
  preco_unitario: number;
  total: number;
  notas?: string | null;
  produtos?: { imagem_url?: string | null } | null;
};

export type Orcamento = {
  id: string;
  cliente_id: string | null;
  nome_cliente_manual: string | null;
  clientes?: { nome: string } | null;
  total: number;
  data_entrega: string | null;
  created_at: string;
  entregue: boolean;
  pago: boolean;
  orcamento_itens?: ItemOrcamento[] | null;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateOnly = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

export function formatCurrency(value: number | string | null | undefined) {
  return currency.format(Number(value) || 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "A combinar";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "A combinar";
  return (/^\d{4}-\d{2}-\d{2}$/.test(value) ? dateOnly : dateTime).format(date);
}

export function searchText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR").trim();
}

export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getUnitPrice(product: Produto) {
  return money(Number(product.preco_final || 0) / Math.max(1, Number(product.rendimento || 1)));
}
