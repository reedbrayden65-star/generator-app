import React from "react";
import { cn } from "../utils/cn";

/** Card container */
export function Card({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Card header row */
export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div>
        <div className="text-lg font-extrabold tracking-tight text-slate-900">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

/** Small status pill */
export function Pill({
  children,
  tone = "neutral",
  className,
}: React.PropsWithChildren<{
  tone?: "neutral" | "warn" | "danger" | "success";
  className?: string;
}>) {
  const tones =
    tone === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold tracking-wide",
        tones,
        className
      )}
    >
      {children}
    </span>
  );
}

/** Primary button component */
export function Button({
  children,
  className,
  variant = "ghost",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "solid" | "danger" | "warn";
}) {
  const styles =
    variant === "solid"
      ? "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
      : variant === "danger"
      ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
      : variant === "warn"
      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
      : "bg-white text-slate-800 hover:bg-slate-50 border-slate-200";

  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold transition active:translate-y-[1px]",
        styles,
        className
      )}
    >
      {children}
    </button>
  );
}
