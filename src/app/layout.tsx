import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClarityInit from "@/components/ClarityInit";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import LLMVisibilityContent from "@/components/shared/LLMVisibilityContent";

import StructuredData from "@/components/shared/StructuredData";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BarberOS",
  "url": "https://barberosplus.com",
  "logo": "https://barberosplus.com/logos/barberos_logo_concept_1.webp",
  "sameAs": [
    "https://cesarreyesjaramillo.com"
  ],
  "founder": {
    "@type": "Person",
    "name": "César Reyes",
    "url": "https://cesarreyesjaramillo.com",
    "sameAs": [
      "https://cesarreyesjaramillo.com"
    ]
  }
};

export const metadata: Metadata = {
  title: {
    default: "BarberOS — Sistema Inteligente de Fidelización y Gestión para Barberías",
    template: "%s | BarberOS",
  },
  description:
    "Transforma tu barbería en un negocio recurrente. Sistema automatizado de tarjetas de fidelidad por WhatsApp, check-in en caja, avisos automáticos y control de clientes en Ecuador.",
  keywords: [
    "BarberOS",
    "software para barberías",
    "fidelización de barberías",
    "tarjeta de fidelidad whatsapp",
    "sistema de barbería ecuador",
    "gestión de clientes barbería",
    "barberos ecuador",
  ],
  metadataBase: new URL("https://barberosplus.com"),
  verification: {
    google: "S4YO9FbiTiBeFAGaOowZq0VlK1T-uhzQjbEIhWNTt9o",
  },
  icons: {
    icon: [
      { url: "/logos/gymos_isotipo_192.png", type: "image/png" },
      { url: "/logos/gymos_isotipo_512.png", type: "image/png" },
    ],
    shortcut: "/logos/gymos_isotipo_192.png",
    apple: "/logos/gymos_isotipo_192.png",
  },
  openGraph: {
    title: "GymOS — Sistema Inteligente de Fidelización y Gestión para Gimnasios",
    description:
      "Aumenta la retención de tus socios y automatiza tu gimnasio por WhatsApp. Fidelización rápida, métricas en vivo y avisos automáticos.",
    url: "https://fidelizacion-sass.vercel.app",
    siteName: "GymOS",
    images: [
      {
        url: "/logos/gymos_logo.png",
        width: 1200,
        height: 630,
        alt: "GymOS - Software e Inteligencia para Gimnasios",
      },
    ],
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GymOS — Sistema Inteligente de Fidelización y Gestión para Gimnasios",
    description:
      "Aumenta la retención de tus socios y automatiza tu gimnasio por WhatsApp.",
    images: ["/logos/gymos_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <StructuredData data={organizationSchema} />
        <ClarityInit />
        <RegisterServiceWorker />
        <LLMVisibilityContent />
        {children}
      </body>
    </html>
  );
}
