import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ProShare Connect",
  description: "Unlimited collective intelligence platform.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "proshareconnect",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Development: Clear service workers to avoid 404 traps */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) {
                      registration.unregister();
                      console.log('ServiceWorker unregistered');
                    }
                  });
                }
              `,
            }}
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground pb-20 pt-16">
            <Header />
            <main className="container max-w-md mx-auto px-4 py-4 min-h-[calc(100vh-8rem)]">
              {children}
            </main>
            <BottomNav />
            <Toaster />
            {/* DEBUG BANNER - REMOVE AFTER VERIFICATION */}
            <div className="fixed bottom-20 left-0 right-0 z-50 pointer-events-none flex justify-center opacity-50">
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                DEPLOY DEBUG: v1.5.3
              </span>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
