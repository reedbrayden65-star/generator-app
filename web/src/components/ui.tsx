import React from "react";
import { cn } from "../utils/cn";

/** Card container - ultra modern with glass morphism */
export function Card({
  className,
  children,
  glow,
}: React.PropsWithChildren<{ className?: string; glow?: "blue" | "emerald" | "amber" | "red" }>) {
  const glowClass = glow ? `glow-${glow}` : "";
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden animate-fade-in",
        glowClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Card header row - ultra modern with gradient border */
export function CardHeader({
  title,
  subtitle,
  right,
  icon,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-transparent px-4 py-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400">
            {icon}
          </div>
        )}
        <div>
          <div className="text-sm font-bold text-white tracking-tight">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Small status pill - ultra modern with glow */
export function Pill({
  children,
  tone = "neutral",
  className,
  pulse,
}: React.PropsWithChildren<{
  tone?: "neutral" | "warn" | "danger" | "success" | "info";
  className?: string;
  pulse?: boolean;
}>) {
  const tones =
    tone === "danger"
      ? "bg-gradient-to-r from-red-500/25 to-red-600/15 text-red-300 border-red-500/40 shadow-red-500/30"
      : tone === "warn"
      ? "bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border-amber-500/40 shadow-amber-500/30"
      : tone === "success"
      ? "bg-gradient-to-r from-emerald-500/25 to-emerald-600/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/30"
      : tone === "info"
      ? "bg-gradient-to-r from-blue-500/25 to-blue-600/15 text-blue-300 border-blue-500/40 shadow-blue-500/30"
      : "bg-gradient-to-r from-slate-600/40 to-slate-700/30 text-slate-300 border-slate-500/40";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm transition-all",
        tones,
        pulse && "animate-pulse-glow",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Primary button component - ultra modern with gradients and hover effects */
export function Button({
  children,
  className,
  variant = "primary",
  size = "sm",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "solid" | "danger" | "warn" | "success";
  size?: "xs" | "sm" | "md";
}) {
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 border-blue-500/50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
      : variant === "solid"
      ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white hover:from-slate-600 hover:to-slate-500 border-slate-500/50 shadow-lg shadow-slate-500/15 hover:shadow-slate-500/25"
      : variant === "danger"
      ? "bg-gradient-to-r from-red-600/40 to-red-700/30 text-red-200 hover:from-red-600/50 hover:to-red-700/40 border-red-500/50 shadow-lg shadow-red-500/15 hover:shadow-red-500/25"
      : variant === "warn"
      ? "bg-gradient-to-r from-amber-600/40 to-amber-700/30 text-amber-200 hover:from-amber-600/50 hover:to-amber-700/40 border-amber-500/50 shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25"
      : variant === "success"
      ? "bg-gradient-to-r from-emerald-600/40 to-emerald-700/30 text-emerald-200 hover:from-emerald-600/50 hover:to-emerald-700/40 border-emerald-500/50 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25"
      : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/90 hover:text-white border-slate-600/50 backdrop-blur-sm";

  const sizes =
    size === "xs" ? "px-2 py-1 text-[10px]" :
    size === "md" ? "px-4 py-2 text-sm" :
    "px-3 py-1.5 text-xs";

  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border font-bold transition-all duration-200 active:scale-[0.98]",
        styles,
        sizes,
        className
      )}
    >
      {children}
    </button>
  );
}

/** Modern input field */
export function Input({
  className,
  icon,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </div>
      )}
      <input
        {...rest}
        className={cn(
          "w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-white placeholder:text-slate-500 outline-none transition-all focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800/70",
          icon && "pl-10",
          className
        )}
      />
    </div>
  );
}

/** Modern stat card */
export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  trend,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
  trend?: "up" | "down";
}) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className="group relative rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/70 to-slate-900/50 p-4 text-left transition-all duration-300 hover:border-slate-600/70 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.02] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
          <div className="rounded-lg p-2 bg-slate-800/80 group-hover:bg-slate-700/80 transition-colors" style={{ boxShadow: `0 0 20px ${color}20` }}>
            <Icon size={14} style={{ color }} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-black text-white tracking-tight">{value}</span>
          {trend && (
            <span className={cn("text-xs font-bold", trend === "up" ? "text-emerald-400" : "text-red-400")}>
              {trend === "up" ? "↑" : "↓"}
            </span>
          )}
        </div>
      </div>
    </Component>
  );
}
