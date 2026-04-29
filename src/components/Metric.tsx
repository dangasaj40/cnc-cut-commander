import React from "react";

interface Props {
  label: string;
  unit?: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: "success" | "warning" | "danger" | "neutral";
  children?: React.ReactNode;
}

export function Metric({ label, unit, value, hint, highlight, icon, badge, badgeVariant = "success", children }: Props) {
  return (
    <div className="glass-card flex flex-col min-h-[260px] relative overflow-hidden transition-all group p-1">
      {/* Top Content Area */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#64748B] tracking-wide flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-baseline gap-1">
            <div className="text-[3.5rem] leading-[1] font-semibold tracking-tight text-[#0F172A]">
              {value}
            </div>
            {unit && (
              <span className="text-sm font-semibold text-[#64748B] uppercase ml-1">{unit}</span>
            )}
          </div>
          
          {badge && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
              badgeVariant === "warning" ? "bg-amber-400 text-amber-950" :
              badgeVariant === "danger" ? "bg-red-500 text-white" :
              badgeVariant === "neutral" ? "bg-slate-200 text-slate-800" :
              "bg-[#A3E635] text-[#0F172A]"
            }`}>
              {badge}
            </div>
          )}
        </div>

        {hint && (
          <div className="mt-2 text-xs font-medium text-[#94A3B8] tracking-wider uppercase">
            {hint}
          </div>
        )}
      </div>
      
      {/* Bottom Sub-Card Area (Floating Chart Block) */}
      {children && (
        <div className="h-[90px] w-full relative overflow-hidden mt-auto -mx-1">
          {children}
        </div>
      )}
    </div>
  );
}
