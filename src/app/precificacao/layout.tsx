import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Precificação | Ateliê da Re",
  description: "Ferramenta profissional de precificação para artesanato",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Precificação",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf2f8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { InstallPWA } from "./_components/InstallPWA";

export default function PrecificacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InstallPWA />
      {children}
    </>
  );
}