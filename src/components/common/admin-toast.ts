"use client";

export type AdminToastKind = "info" | "success" | "error";

export type AdminToastPayload = {
  id?: string;
  message: string;
  kind?: AdminToastKind;
};

const ADMIN_TOAST_EVENT = "tm:admin:toast";

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function showAdminToast(input: AdminToastPayload) {
  if (typeof window === "undefined") {
    return;
  }
  const payload: AdminToastPayload = {
    id: input.id ?? makeId(),
    message: input.message,
    kind: input.kind ?? "info",
  };
  window.dispatchEvent(new CustomEvent<AdminToastPayload>(ADMIN_TOAST_EVENT, { detail: payload }));
}

export function adminToastEventName() {
  return ADMIN_TOAST_EVENT;
}
