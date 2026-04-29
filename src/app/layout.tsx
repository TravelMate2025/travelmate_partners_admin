import type { Metadata } from "next";

import "@/app/globals.css";
import { AdminToastCenter } from "@/components/common/admin-toast-center";
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
        <AdminSessionProvider session={session}>
          {children}
          <AdminToastCenter />
        </AdminSessionProvider>
      </body>
    </html>
  );
}
