import "@fontsource/inter/400.css";
import "@fontsource/montserrat/700.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckMate",
  description: "Public accountability, with a roast!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-jet font-body text-white">
        <header className="sticky top-0 z-20 w-full bg-jet border-b-4 border-royal shadow-chess py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/checkmate.png"
              alt="CheckMate Logo"
              className="h-10 w-10"
            />
            <span className="font-header text-2xl uppercase tracking-widest text-royal font-bold">
              CheckMate
            </span>
            <span className="text-xs text-lime font-header font-bold ml-2 hidden sm:inline uppercase">
              Don't get roasted. Check in!
            </span>
          </div>
          <nav className="flex gap-4 text-royal font-header text-sm uppercase">
            <a href="/dashboard" className="hover:text-lime transition-colors">
              Dashboard
            </a>
            <a href="/settings" className="hover:text-lime transition-colors">
              Settings
            </a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
