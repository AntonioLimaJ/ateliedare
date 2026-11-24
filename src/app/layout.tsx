import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/playfair-display";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ateliê da Rê | Bordados personalizados",
  description: "Bordado eletrônico personalizado para enxovais, presentes, uniformes e empresas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      translate="no"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
