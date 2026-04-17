"use client";

import { createContext, useContext } from "react";

import type { AdminSession } from "@/modules/auth/types";

const AdminSessionContext = createContext<AdminSession | null>(null);

export function AdminSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AdminSession | null;
}) {
  return <AdminSessionContext.Provider value={session}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
