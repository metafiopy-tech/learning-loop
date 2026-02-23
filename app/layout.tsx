import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Learning Loop",
  description: "A tool that makes thinking unavoidable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
