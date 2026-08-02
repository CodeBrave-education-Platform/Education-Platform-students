import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ToastProvider";
import { Suspense } from "react";
import Script from "next/script";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

export const metadata = {
  title: "CodeBrave Education Platform",
  description: "Modern JEE & NEET Competitive Exam Preparation Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className="font-sans">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            {children}
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

        {/* Secure inline PWA Service Worker registration */}
        <script
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
