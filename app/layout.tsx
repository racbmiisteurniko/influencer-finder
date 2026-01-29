import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influencer Finder — Savon Yvard",
  description:
    "Recherche d'influenceurs Instagram et TikTok pour cosmétiques artisanaux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
