import React from "react";
import "./globals.css";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { QueryProvider } from "@/src/components/QueryProvider";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { NotificationProviders } from "@/src/components/providers/NotificationProviders";

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
            <NotificationProviders>
              <QueryProvider>
                <SettingsProvider>
                  {children}
                </SettingsProvider>
              </QueryProvider>
            </NotificationProviders>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
