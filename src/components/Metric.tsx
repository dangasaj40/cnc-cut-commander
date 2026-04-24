import React from "react";

interface Props {
  label: string;
  unit?: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

export function Metric({ label, unit, value, hint, highlight, icon }: Props) {
  return (
    <div className={`glass-card p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all hover:border-primary/30 group ${highlight ? "border-primary/20" : ""}`}>
      {highlight && (
        <div className="absolute top-0 right-0 size-32 bg-primary/10 blur-[60px] -mr-16 -mt-16 rounded-full" />
      )}
      
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
          {hint && (
            <span className="text-[9px] font-medium text-muted-foreground/60 tracking-wider uppercase">{hint}</span>
          )}
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-500 ${highlight ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(251,191,36,0.15)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]" : "bg-white/5 text-muted-foreground group-hover:text-white"}`}>
          {icon}
        </div>
      </div>

      <div className="mt-auto z-10 flex items-baseline gap-2">
        <div className={`text-4xl font-black tracking-tight tabular-nums ${highlight ? "text-primary" : "text-white"}`}>
          {value}
        </div>
        {unit && (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{unit}</span>
        )}
      </div>
    </div>
  );
}
