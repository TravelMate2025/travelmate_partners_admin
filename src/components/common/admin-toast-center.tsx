"use client";

import { useEffect, useMemo, useState } from "react";

import { adminToastEventName, type AdminToastKind, type AdminToastPayload } from "@/components/common/admin-toast";

type AdminToastItem = {
  id: string;
  message: string;
  kind: AdminToastKind;
};

const MAX_TOASTS = 4;

export function AdminToastCenter() {
  const [items, setItems] = useState<AdminToastItem[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<AdminToastPayload>;
      if (!custom.detail?.id || !custom.detail.message) {
        return;
      }
      const next: AdminToastItem = {
        id: custom.detail.id,
        message: custom.detail.message,
        kind: custom.detail.kind ?? "info",
      };
      setItems((prev) => [next, ...prev].slice(0, MAX_TOASTS));
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== next.id));
      }, 4200);
    }

    const eventName = adminToastEventName();
    window.addEventListener(eventName, onToast as EventListener);
    return () => {
      window.removeEventListener(eventName, onToast as EventListener);
    };
  }, []);

  const rendered = useMemo(
    () =>
      items.map((item) => (
        <li
          key={item.id}
          className={`tm-admin-toast tm-admin-toast-${item.kind}`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium">{item.message}</p>
        </li>
      )),
    [items],
  );

  if (items.length === 0) {
    return null;
  }

  return <ul className="tm-admin-toast-stack">{rendered}</ul>;
}
