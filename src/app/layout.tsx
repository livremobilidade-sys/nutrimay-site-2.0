import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MayNutri | Frutas Premium para Alta Performance",
  description: "Receba frutas frescas e selecionadas direto no seu ponto de retirada. Acesso exclusivo via convite. Alta performance, nutrição de verdade.",
  metadataBase: new URL("https://maynutri.com.br"),
  openGraph: {
    title: "MayNutri | Frutas Premium para Alta Performance",
    description: "Receba frutas frescas e selecionadas direto no seu ponto de retirada. Acesso exclusivo via convite.",
    url: "https://maynutri.com.br",
    siteName: "MayNutri",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MayNutri | Frutas Premium",
    description: "Frutas frescas e selecionadas com acesso exclusivo. Entre na lista VIP.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://maynutri.com.br",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <AuthGuard>
            <Header />
            {children}
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
