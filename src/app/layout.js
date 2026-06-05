import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

export const metadata = {
  title: "Education Portal",
  description: "Your modern educational platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className="font-sans">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </ThemeProvider>

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

