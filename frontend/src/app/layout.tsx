import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Bungee } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavBarWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bungee",
});


export const metadata: Metadata = {
  title: "Find My Friend",
  description: "Find your tribe :)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} antialiased`}
      >
        {/*
          Wrap NavbarWrapper in Suspense.
          Why? usePathname can sometimes be undefined during initial server render
          or when navigating client-side to a new path. Suspense provides a fallback
          while the client component hydrates or the path becomes available.
          It's good practice for client components in server component trees.
        */}
        <Suspense fallback={<div>Loading navigation...</div>}>
          <NavbarWrapper />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
