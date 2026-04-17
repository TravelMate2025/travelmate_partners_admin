import type { Metadata } from "next";

import "@/app/globals.css";
import { AdminSessionProvider } from "@/modules/auth/admin-session-context";
import { getAdminSession } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "TravelMate Admin Dashboard",
  description: "Back-office shell for verification, moderation, finance, and platform operations.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAdminSession();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AdminSessionProvider session={session}>{children}</AdminSessionProvider>
      </body>
    </html>
  );
}
