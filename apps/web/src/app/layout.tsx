import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/auth-provider";
import { PaddleProvider } from "@/features/subscription/paddle-provider";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ShowFlux — Real Estate Listing & Showing Management",
    template: "%s | ShowFlux",
  },
  description:
    "Streamline your brokerage with ShowFlux. Manage listings, schedule showings, track offers, and collaborate with your team — all in one platform.",
  openGraph: {
    type: "website",
    siteName: "ShowFlux",
    title: {
      default: "ShowFlux — Real Estate Listing & Showing Management",
      template: "%s | ShowFlux",
    },
    description:
      "Streamline your brokerage with ShowFlux. Manage listings, schedule showings, track offers, and collaborate with your team.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "ShowFlux",
                url: SITE_URL,
                description:
                  "Real estate listing and showing management platform for brokerages.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "ShowFlux",
                url: SITE_URL,
                description:
                  "Manage listings, showings, offers, and team collaboration for real estate brokerages.",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "ShowFlux",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description:
                  "Real estate listing and showing management platform. Manage property listings, schedule showings, track offers, and collaborate with your brokerage team.",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  description: "Free trial available",
                },
                featureList: [
                  "Property listing management",
                  "Showing scheduling with conflict detection",
                  "Offer tracking and comparison",
                  "Team collaboration and role-based access",
                  "Workspace-based multi-tenancy",
                  "Real-time activity dashboard",
                ],
              },
            ]),
          }}
        />
        <AuthProvider>
          <PaddleProvider>
            <ToastProvider>{children}</ToastProvider>
          </PaddleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
