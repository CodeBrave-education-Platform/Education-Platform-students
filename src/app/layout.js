import "./globals.css";
import AIAssistant from "@/components/AIAssistant";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ToastProvider";
import { Suspense } from "react";
import Script from "next/script";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import ScrollToTop from "@/components/navigation/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import UTMTracker from "@/components/UTMTracker";
import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
  title: "Asentra Education Platform",
  description: "Modern JEE & NEET Competitive Exam Preparation Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${outfit.variable} font-sans`}>
      <body className="overflow-x-hidden pb-24 md:pb-0">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Skip to Content - Accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-indigo-600 text-white px-4 py-2 font-bold rounded-lg shadow-xl">
            Skip to content
          </a>

          <ToastProvider>
            <Suspense fallback={null}>
              <UTMTracker />
            </Suspense>
            
            <div id="main-content">
              {children}
            </div>

            <AIAssistant />
            <ScrollToTop />
            <CookieBanner />
            
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
          </ToastProvider>
        </ThemeProvider>

        {/* Global Razorpay Checkout SDK Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        {/* Secure inline PWA Service Worker registration via Next.js Script */}
        <Script
          id="pwa-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('ASENTRA Service Worker registered under scope:', reg.scope);
                  }).catch(function(err) {
                    console.warn('ASENTRA Service Worker registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
