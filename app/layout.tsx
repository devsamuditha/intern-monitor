import React from "react";
import "./globals.css";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { AuthProvider } from "@/src/context/AuthContext";

export const metadata = {
  title: "InternTrack",
  description: "Software Engineering Daily Journal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
