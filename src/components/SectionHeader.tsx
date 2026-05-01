import type { ReactNode } from "react";

interface Props {
  code: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function SectionHeader({ code, title, subtitle, right }: Props) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-[#F1F5F9] text-[#64748B] font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E2E8F0]">
            {code}
          </span>
          {subtitle && (
            <p className="text-[11px] text-[#94A3B8] font-medium tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
          {title}
        </h1>
      </div>

      {right && <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-200/60">{right}</div>}
    </div>
  );
}
