"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";
import type { MatchStatus } from "@/lib/types";

/* ---------- Buttons ---------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-sans font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f59e0b]",
        "disabled:opacity-40 disabled:pointer-events-none",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
        variant === "primary" && "bg-[#990000] text-white hover:bg-[#b30000] shadow-[0_0_24px_rgba(153,0,0,0.35)]",
        variant === "secondary" && "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/25",
        variant === "ghost" && "text-white/60 hover:text-white hover:bg-white/5",
        variant === "danger" && "border border-red-500/30 text-red-300 hover:bg-red-500/10",
        className
      )}
    />
  );
}

/* ---------- Form fields ---------- */

export const inputClass =
  "w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white font-sans " +
  "placeholder:text-white/30 [color-scheme:dark] transition-colors " +
  "focus:outline-none focus:border-[#f59e0b]/60 focus:ring-1 focus:ring-[#f59e0b]/40 " +
  "disabled:opacity-40";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold text-white/60 mb-1.5 font-sans">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-white/35">{hint}</p>
      ) : null}
    </div>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={clsx(inputClass, "[&>option]:bg-[#0a0a0a] [&>option]:text-white", props.className)} />
  );
}

/* ---------- Status badge ---------- */

export function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#f59e0b]/50 bg-[#f59e0b]/20 text-[10px] font-bold uppercase tracking-widest text-white">
        <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="px-2.5 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/60">
        Full time
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
      Upcoming
    </span>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the first field so the keyboard works straight away.
    const t = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    }, 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={clsx(
              "relative w-full max-h-[92vh] flex flex-col bg-[#0a0a0a] border border-white/10 border-t-white/20",
              "rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.7)]",
              wide ? "sm:max-w-3xl" : "sm:max-w-xl"
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-2xl font-display font-bold tracking-tight text-white">{title}</h2>
                {subtitle && <p className="text-sm text-white/45 mt-1 normal-case font-sans">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 -mr-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#f59e0b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 sm:px-8 py-6 overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-6 sm:px-8 py-4 border-t border-white/[0.06] flex flex-wrap items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-white/70 leading-relaxed">{message}</p>
    </Modal>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel px-8 py-14 text-center">
      <h3 className="text-2xl font-display font-bold text-white/90">{title}</h3>
      <p className="text-sm text-white/50 mt-2 max-w-md mx-auto normal-case font-sans">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
