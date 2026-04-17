"use client";

import { useState } from "react";

type ReviewDrawerProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function ReviewDrawer({ title, subtitle, children }: ReviewDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="tm-btn tm-btn-outline" onClick={() => setOpen(true)} type="button">
        Open Review Drawer
      </button>

      {open ? (
        <div className="tm-drawer-backdrop" role="presentation">
          <div aria-modal="true" className="tm-drawer" role="dialog">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="tm-kicker">Review Surface</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
                <p className="tm-muted mt-2 text-sm">{subtitle}</p>
              </div>
              <button className="tm-btn tm-btn-outline" onClick={() => setOpen(false)} type="button">
                Close
              </button>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
