import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusEngage - Holistic Student Engagement Platform",
  description: "Track and gamify your complete campus journey beyond academics. Get recognized for participation in technical societies, cultural clubs, sports, and leadership activities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
