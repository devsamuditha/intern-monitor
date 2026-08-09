import React from "react";
import "./globals.css";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { QueryProvider } from "@/src/components/QueryProvider";
import { SettingsProvider } from "@/src/context/SettingsContext";

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
            <QueryProvider>
              <SettingsProvider>
                {children}
              </SettingsProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
