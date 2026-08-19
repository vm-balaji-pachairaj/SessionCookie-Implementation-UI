import type { Metadata } from "next";
import "./globals.css";
import SameTabSession from "@/component/SameTabSession";


export const metadata: Metadata = {
  title: "My Application",
  description: "My Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SameTabSession />
        {children}
      </body>
    </html>
  );
}
