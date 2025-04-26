import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
  display: "swap",
});
export const viewport = {
  themeColor: "#ffffff", // Agora dentro de viewport
};

export const metadata: Metadata = {
  title: {
    default: "Tex - Finance Dashboard",
    template: "Tex - %s",
  },
  description: "Seu sistema de finance dashboard mais completo.",
  icons: {
    icon: "../../TFDfavicon.ico", // ou '/favicon.png'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F9FAFB" />
      </head>
      <body
        className={`${poppins.variable} antialiased bg-white text-gray-700`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
