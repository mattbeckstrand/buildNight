import ClientHeader from "@/components/ClientHeader";
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
        <ClientHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
