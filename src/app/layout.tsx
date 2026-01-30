import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Vitolux – generators, welding, heat pumps, equipment",
  description: "Vitolux: generators, welding equipment, heat pumps, stabilizers, compressors and professional machinery. UAH & EUR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <Layout>{children}</Layout>
        </LanguageProvider>
      </body>
    </html>
  );
}
