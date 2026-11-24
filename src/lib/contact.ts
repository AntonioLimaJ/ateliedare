export function getWhatsAppUrl() {
  const number = process.env.ATELIE_WHATSAPP_NUMBER?.trim() || "5513988540514";
  if (!number || !/^55[1-9][0-9]{9,10}$/.test(number)) return null;
  const message = "Olá! Gostaria de solicitar um orçamento de bordado personalizado.";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
