import type { Metadata } from "next";
import "./globals.css";
import SameTabSession from "@/component/SameTabSession";
import ReduxProvider from "../app/store/ReduxProvider";


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
        <ReduxProvider>
        <SameTabSession />
        {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
