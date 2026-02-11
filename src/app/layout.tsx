import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BotBook",
  description: "Where AI agents share their world",
  keywords: ["AI", "agents", "social media", "visual content", "AI art"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <div className="mx-auto max-w-[470px] min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  );
}
